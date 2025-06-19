from fastapi import APIRouter, Body, HTTPException
from typing import List
import json
import re
import logging

from app.models.schema_models import RicettaRequest, RicettaOutput

router = APIRouter(prefix="/ricette", tags=["ricette"])
logger = logging.getLogger("uvicorn.error")

# Nota: serve avere l'istanza client OpenAI impostata esternamente
client = None

@router.post("", response_model=RicettaOutput)
async def genera_ricette(payload: RicettaRequest = Body(...)):
    if client is None:
        raise HTTPException(status_code=500, detail="OpenAI client non configurato")

    tipo_pasto = payload.tipo_pasto
    tipo_schema = payload.tipo_schema

    logger.debug(f"Richiesta ricetta: tipo_pasto='{tipo_pasto}', tipo_schema='{tipo_schema}'")

    from app.database import SessionLocal
    from sqlalchemy import text
    from app.models.orm_models import SchemaNutrizionale

    async with SessionLocal() as session:
        # Carica schema nutrizionale
        result = await session.execute(
            text("SELECT * FROM schemi_nutrizionali WHERE nome = :nome LIMIT 1"),
            {"nome": tipo_schema}
        )
        schema_row = result.first()
        if not schema_row:
            logger.error(f"Nessuno schema trovato per nome '{tipo_schema}'")
            raise HTTPException(status_code=404, detail=f"Nessuno schema nutrizionale trovato per schema '{tipo_schema}'")

        schema = dict(schema_row._mapping)
        dettagli = json.loads(schema['dettagli']) if schema['dettagli'] else {}

        if tipo_pasto not in dettagli:
            logger.error(f"Dettagli pasto '{tipo_pasto}' non trovati nello schema '{tipo_schema}'")
            raise HTTPException(status_code=404, detail=f"Nessun dettaglio trovato per tipo pasto '{tipo_pasto}' nello schema '{tipo_schema}'")

        dettagli_pasto = dettagli[tipo_pasto]
        if not isinstance(dettagli_pasto, dict):
            logger.error(f"dettagli_pasto non è dict ma {type(dettagli_pasto)}")
            raise HTTPException(status_code=500, detail=f"dettagli_pasto non è un dict, ma {type(dettagli_pasto)}")

        opzioni_list = dettagli_pasto.get("opzioni")
        if not isinstance(opzioni_list, list):
            logger.error(f"Chiave 'opzioni' non è lista ma {type(opzioni_list)}")
            raise HTTPException(status_code=500, detail="La chiave 'opzioni' non contiene una lista valida")

        logger.debug(f"Numero di opzioni disponibili: {len(opzioni_list)}")
        for i, opzione in enumerate(opzioni_list):
            logger.debug(f"Opzione[{i}]: type={type(opzione)}, value={opzione}")

        # Carica prodotti disponibili
        result = await session.execute(
            text("SELECT nome FROM prodotti WHERE quantita > 0")
        )
        prodotti = result.fetchall()
        prodotti_disponibili = [row[0].lower() for row in prodotti]
        logger.debug(f"Prodotti disponibili ({len(prodotti_disponibili)}): {prodotti_disponibili}")

    # Prepara lista alimenti schema per mapping
    alimenti_schema = set()
    for opzione in opzioni_list:
        gruppi = opzione.get("gruppi_alimenti", [])
        for gruppo in gruppi:
            for alimento in gruppo.get("alimenti", []):
                alimenti_schema.add(alimento["nome"].lower())
    logger.debug(f"Alimenti schema unici: {len(alimenti_schema)}")

    # Prompt per mappare alimenti schema a prodotti disponibili
    mapping_prompt = (
        f"Ho una lista di alimenti di uno schema nutrizionale:\n"
        f"{list(alimenti_schema)}\n\n"
        f"E una lista di prodotti disponibili:\n"
        f"{prodotti_disponibili}\n\n"
        f"Restituisci una mappatura JSON che associa ogni alimento dello schema al nome prodotto più corretto tra quelli disponibili, o null se non trovato.\n"
        f"Rispondi SOLO con un JSON valido senza spiegazioni."
    )
    logger.debug(f"Prompt mapping nomi alimenti:\n{mapping_prompt}")

    try:
        response_map = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": mapping_prompt}],
            max_tokens=500,
        )
        raw_map_content = response_map.choices[0].message.content.strip()
        logger.debug(f"Risposta raw mapping:\n{raw_map_content}")

        match_map = re.search(r"```json\s*(\{.*\})\s*```", raw_map_content, re.DOTALL)
        json_map_text = match_map.group(1) if match_map else raw_map_content

        nome_mapping = json.loads(json_map_text)
        logger.debug(f"Mapping nomi ottenuto: {nome_mapping}")
    except Exception as e:
        logger.error(f"Errore mapping nomi alimenti: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore nel mapping nomi alimenti: {str(e)}")

    prompt_opzioni = []
    alimenti_trovati = False

    for opzione in opzioni_list:
        if isinstance(opzione, str):
            try:
                opzione = json.loads(opzione)
            except Exception:
                logger.error("Errore parsing opzione JSON")
                raise HTTPException(status_code=500, detail="Errore parsing opzione JSON")

        opzione_num = opzione.get("opzione")
        gruppi = opzione.get("gruppi_alimenti", [])

        scelta_alimenti = []
        macronutrienti_scelti = set()

        for gruppo in gruppi:
            alimenti = gruppo.get("alimenti", [])
            trovato = False
            for alimento in alimenti:
                nome_alimento_originale = alimento["nome"].lower()
                nome_alimento_mappato = nome_mapping.get(nome_alimento_originale)

                if nome_alimento_mappato and nome_alimento_mappato in prodotti_disponibili:
                    macro = alimento["macronutriente"].lower()
                    if macro not in macronutrienti_scelti:
                        scelta_alimenti.append(alimento)
                        macronutrienti_scelti.add(macro)
                        trovato = True
                        alimenti_trovati = True
                        break
            if not trovato:
                continue

        descrizione_alimenti = ", ".join(
            f"{a['nome']} ({a['quantita']}, {a['macronutriente']})" for a in scelta_alimenti
        )
        logger.debug(f"Opzione {opzione_num} scelta alimenti: {descrizione_alimenti}")
        prompt_opzioni.append(f"Opzione {opzione_num}: {descrizione_alimenti}")

    if not alimenti_trovati:
        logger.warning(f"Nessun alimento disponibile trovato per schema '{tipo_schema}' e pasto '{tipo_pasto}'")
        raise HTTPException(
            status_code=404,
            detail=f"Nessun alimento disponibile corrispondente allo schema nutrizionale '{tipo_schema}' per il pasto '{tipo_pasto}'."
        )

    prompt = (
        f"Genera una ricetta equilibrata per il pasto '{tipo_pasto}' "
        f"seguendo lo schema nutrizionale '{tipo_schema}' con valori minimi: "
        f"calorie >= {schema['calorie']}, proteine >= {schema['proteine']}g, "
        f"carboidrati >= {schema['carboidrati']}g, grassi >= {schema['grassi']}g.\n\n"
        "Usa SOLO gli alimenti indicati di seguito e SOLO nelle quantità specificate (non aggiungere o modificare quantità):\n"
        + "\n".join(prompt_opzioni) +
        "\n\n"
        "Se per qualche macronutriente non ci sono alimenti disponibili nello schema, "
        "non aggiungere niente ma menziona chiaramente che manca la fonte per quel macronutriente.\n"
        "Fornisci SOLO una opzione scegliendo UN SOLO alimento per ogni macronutriente presente.\n"
        "Il risultato deve essere SOLO in questo formato JSON, senza altre spiegazioni:\n"
        "{\n"
        "  \"titolo\": \"Titolo della ricetta\",\n"
        "  \"ingredienti\": [{\"nome\": \"Nome alimento\", \"quantita\": \"Quantità\"}, ...],\n"
        "  \"procedimento\": \"Procedimento dettagliato della ricetta\"\n"
        "}"
    )

    logger.debug(f"Prompt inviato a GPT:\n{prompt}")

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=700,
        )
        raw_content = response.choices[0].message.content.strip()
        logger.debug(f"Risposta raw da GPT:\n{raw_content}")

        match = re.search(r"```json\s*(\{.*\})\s*```", raw_content, re.DOTALL)
        json_text = match.group(1) if match else raw_content

        ricetta_dict = json.loads(json_text)
        logger.debug(f"Ricetta parsata: {ricetta_dict}")

        ricetta = RicettaOutput(**ricetta_dict)
        return ricetta

    except json.JSONDecodeError as e:
        logger.error(f"Errore parsing JSON da GPT: {e.msg}")
        raise HTTPException(status_code=500, detail=f"Errore parsing JSON da GPT: {e.msg}")
    except Exception as e:
        logger.error(f"Errore generazione ricetta: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore generazione ricetta: {str(e)}")
