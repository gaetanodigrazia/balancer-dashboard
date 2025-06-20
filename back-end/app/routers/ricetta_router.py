from fastapi import APIRouter, HTTPException
from typing import Dict
import json
import logging
import re

from sqlalchemy import text
from app.models.schema_models import RicettaOutput, DettagliPasto
from app.models.orm_models import SchemaNutrizionale
from app.database import SessionLocal

router = APIRouter(prefix="/ricette", tags=["ricette"])
logger = logging.getLogger("uvicorn.error")

client = None  # Assicurati che venga inizializzato nel main


def normalizza_dettagli(raw_dettagli: dict) -> dict:
    normalized = {}
    if not isinstance(raw_dettagli, dict):
        logger.warning("⚠️ 'dettagli' non è un dizionario valido")
        return {}

    for key, val in raw_dettagli.items():
        if isinstance(val, dict) and "opzioni" in val and isinstance(val["opzioni"], list):
            try:
                normalized[key] = DettagliPasto.parse_obj(val)
            except Exception as e:
                logger.warning(f"❌ Errore parsing per '{key}': {e}")
                logger.debug(f"Contenuto non valido:\n{json.dumps(val, indent=2)}")
                normalized[key] = DettagliPasto(opzioni=[])
        else:
            normalized[key] = DettagliPasto(opzioni=[])
    return normalized


@router.post("/genera/{schema_id}/{tipo_pasto}", response_model=RicettaOutput)
async def genera_ricetta(schema_id: int, tipo_pasto: str):
    if client is None:
        raise HTTPException(status_code=500, detail="OpenAI client non configurato")

    logger.info(f"🟡 Richiesta generazione ricetta per schema ID={schema_id}, tipo_pasto='{tipo_pasto}'")

    async with SessionLocal() as session:
        result = await session.execute(
            text("SELECT * FROM schemi_nutrizionali WHERE id = :id"),
            {"id": schema_id}
        )
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Schema non trovato")

        schema_data = dict(row._mapping)
        logger.debug(f"📥 RIGA DB: {schema_data}")
        nome_schema = schema_data.get("nome", "")

        raw_json = schema_data.get("dettagli", "{}")
        if not raw_json or raw_json.strip() == "":
            raise HTTPException(status_code=404, detail="Lo schema non contiene dettagli")

        try:
            dettagli_raw = json.loads(raw_json)
            dettagli = normalizza_dettagli(dettagli_raw)
        except Exception as e:
            logger.error(f"❌ Errore parsing dettagli: {e}")
            raise HTTPException(status_code=500, detail="Errore nel parsing dei dettagli")

        if tipo_pasto not in dettagli:
            raise HTTPException(status_code=404, detail=f"Nessun dettaglio per tipo pasto '{tipo_pasto}'")

        opzioni_list = dettagli[tipo_pasto].opzioni
        logger.info(f"📦 Numero opzioni per '{tipo_pasto}': {len(opzioni_list)}")

        if not isinstance(opzioni_list, list) or len(opzioni_list) == 0:
            raise HTTPException(status_code=400, detail=f"Nessuna opzione disponibile per il pasto '{tipo_pasto}'")

        # Prompt construction
        prompt_opzioni = []
        for gruppo in opzioni_list:
            alimenti = gruppo.alimenti
            nome_gruppo = (gruppo.nome or "").strip().capitalize()
            if not alimenti:
                continue

            logger.info(f"🧩 Gruppo: {nome_gruppo} – {len(alimenti)} alimenti")

            descrizioni = []
            for alimento in alimenti:
                if alimento.macronutriente == "gruppo":
                    combo = ", ".join(
                        f"{a.nome} ({a.grammi}g)" for a in (alimento.gruppoAlimenti or [])
                    )
                    descrizioni.append(f"{alimento.nome}: {combo}")
                else:
                    descrizioni.append(f"{alimento.nome} ({alimento.grammi}g)")

            gruppo_descrizione = f"{nome_gruppo or 'Opzione'}:\n- " + "\n- ".join(descrizioni)
            prompt_opzioni.append(gruppo_descrizione)

        prompt = (
            f"Genera una ricetta semplice e bilanciata per il pasto '{tipo_pasto}' "
            f"basandoti sul seguente schema nutrizionale '{nome_schema}'.\n\n"
            f"Per ogni gruppo alimentare indicato di seguito, scegli un solo alimento (oppure una combo, se presente):\n\n"
            + "\n\n".join(prompt_opzioni) +
            "\n\n"
            "Scrivi il risultato in formato JSON con questa struttura:\n"
            "{\n"
            "  \"titolo\": \"Titolo della ricetta\",\n"
            "  \"ingredienti\": [{\"nome\": \"Nome alimento\", \"quantita\": \"Quantità\"}, ...],\n"
            "  \"procedimento\": \"Testo descrittivo (max 5 passaggi)\",\n"
            "  \"presentazione\": \"Suggerimento su come servire il piatto\",\n"
            "  \"nota_nutrizionale\": \"(facoltativa) Breve nota nutrizionale\"\n"
            "}"
        )

        logger.debug(f"📝 Prompt inviato a GPT:\n{prompt}")

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800,
            )
            content = response.choices[0].message.content.strip()
            logger.debug(f"📤 Risposta GPT:\n{content}")

            match = re.search(r"```json\s*(\{.*?\})\s*```", content, re.DOTALL)
            json_text = match.group(1) if match else content
            parsed = json.loads(json_text)

            return RicettaOutput(**parsed)

        except json.JSONDecodeError as e:
            logger.error(f"❌ Errore parsing JSON da GPT: {e.msg}")
            raise HTTPException(status_code=500, detail="Errore nel parsing della risposta del modello")
        except Exception as e:
            logger.error(f"❌ Errore GPT: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Errore nella generazione della ricetta")
