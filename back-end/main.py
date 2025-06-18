from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
from pydantic import BaseModel, ValidationError, parse_obj_as
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy import Column, Integer, Float, String, ForeignKey, Text, text, inspect
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List, Dict
import base64
import os
import json
import re
from dotenv import load_dotenv

# ----------------- MODELLI PYDANTIC -----------------
class Alimento(BaseModel):
    nome: str
    quantita: str
    macronutriente: str

class GruppoAlimenti(BaseModel):
    alimenti: List[Alimento]

class Opzione(BaseModel):
    opzione: int
    gruppi_alimenti: List[GruppoAlimenti]

class DettagliPasto(BaseModel):
    opzioni: List[Opzione]

class SchemaNutrizionaleInput(BaseModel):
    nome: str
    calorie: float
    carboidrati: float
    grassi: float
    proteine: float
    acqua: float
    dettagli: Dict[str, DettagliPasto]

class SchemaNutrizionaleOut(SchemaNutrizionaleInput):
    id: int
    class Config:
        orm_mode = True

class ProdottoModel(BaseModel):
    nome: str
    quantita: int
    prezzo_unitario: float

class OCRResponse(BaseModel):
    prodotti: List[ProdottoModel]
    totale: float
    data: str

class ScontrinoOut(BaseModel):
    id: int
    data: str
    totale: float
    class Config:
        orm_mode = True

class ProdottoOut(BaseModel):
    id: int
    nome: str
    quantita: int
    prezzo_unitario: float
    scontrino_id: Optional[int]
    class Config:
        orm_mode = True

class Ingrediente(BaseModel):
    nome: str
    quantita: str

class RicettaOutput(BaseModel):
    titolo: str
    ingredienti: List[Ingrediente]
    procedimento: str

class RicettaRequest(BaseModel):
    tipo_pasto: str
    tipo_schema: str

# ----------------- ENV -----------------
load_dotenv()
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "ocr_db")

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ----------------- OPENAI SETUP -----------------
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    default_headers={"OpenAI-Client-Data-Retention": "none"}
)

# ----------------- FASTAPI SETUP -----------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- DATABASE SETUP -----------------
engine = create_async_engine(DATABASE_URL, echo=False)
Base = declarative_base()
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ----------------- MODELLI DATABASE -----------------
class Scontrino(Base):
    __tablename__ = "scontrini"
    id = Column(Integer, primary_key=True, index=True)
    data = Column(String, index=True)
    totale = Column(Float)
    prodotti = relationship("Prodotto", back_populates="scontrino", cascade="all, delete")

class Prodotto(Base):
    __tablename__ = "prodotti"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    quantita = Column(Integer)
    prezzo_unitario = Column(Float)
    scontrino_id = Column(Integer, ForeignKey("scontrini.id"), nullable=True)
    scontrino = relationship("Scontrino", back_populates="prodotti")

class SchemaNutrizionale(Base):
    __tablename__ = "schemi_nutrizionali"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False, index=True)
    calorie = Column(Float, nullable=False)
    carboidrati = Column(Float, nullable=False)
    grassi = Column(Float, nullable=False)
    proteine = Column(Float, nullable=False)
    acqua = Column(Float, nullable=False)
    dettagli = Column(Text, nullable=False)  # JSON serializzato come stringa

# ----------------- FUNZIONI UTILI -----------------
def extract_json(text: str) -> dict:
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    cleaned = match.group(1) if match else text.strip()
    return json.loads(cleaned)

# ----------------- ROUTE -----------------

@app.post("/schemi-nutrizionali", response_model=List[SchemaNutrizionaleOut])
async def crea_schemi(schemi: List[SchemaNutrizionaleInput]):
    saved_schemi = []
    async with SessionLocal() as session:
        for schema in schemi:
            # Converti modelli Pydantic in dict prima di serializzare JSON
            dettagli_dict = {k: v.dict() for k, v in schema.dettagli.items()}
            dettagli_json = json.dumps(dettagli_dict)

            existing = await session.execute(
                text("SELECT * FROM schemi_nutrizionali WHERE nome = :nome"),
                {"nome": schema.nome}
            )
            existing_row = existing.first()

            if existing_row:
                db_schema = await session.get(SchemaNutrizionale, existing_row.id)
                db_schema.calorie = schema.calorie
                db_schema.carboidrati = schema.carboidrati
                db_schema.grassi = schema.grassi
                db_schema.proteine = schema.proteine
                db_schema.acqua = schema.acqua
                db_schema.dettagli = dettagli_json
            else:
                db_schema = SchemaNutrizionale(
                    nome=schema.nome,
                    calorie=schema.calorie,
                    carboidrati=schema.carboidrati,
                    grassi=schema.grassi,
                    proteine=schema.proteine,
                    acqua=schema.acqua,
                    dettagli=dettagli_json
                )
                session.add(db_schema)

            saved_schemi.append(db_schema)

        await session.commit()
        for s in saved_schemi:
            await session.refresh(s)

    # Converto dettagli JSON in Pydantic per la risposta
    result = []
    for s in saved_schemi:
        try:
            dettagli_obj = {k: DettagliPasto.parse_obj(v) for k, v in json.loads(s.dettagli).items()}
        except Exception:
            dettagli_obj = None

        schema_out = SchemaNutrizionaleOut(
            id=s.id,
            nome=s.nome,
            calorie=s.calorie,
            carboidrati=s.carboidrati,
            grassi=s.grassi,
            proteine=s.proteine,
            acqua=s.acqua,
            dettagli=dettagli_obj
        )
        result.append(schema_out)

    return result


@app.get("/schemi-nutrizionali", response_model=List[SchemaNutrizionaleOut])
async def get_schemi():
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT * FROM schemi_nutrizionali ORDER BY id DESC"))
        rows = result.fetchall()
        schemi = []
        for row in rows:
            data = dict(row._mapping)
            if data.get('dettagli'):
                try:
                    dettagli_dict = json.loads(data['dettagli'])
                    dettagli_obj = {k: DettagliPasto.parse_obj(v) for k, v in dettagli_dict.items()}
                    data['dettagli'] = dettagli_obj
                except Exception:
                    data['dettagli'] = {}
            else:
                data['dettagli'] = {}
            schemi.append(data)
        return schemi


@app.post("/ocr-scontrino")
async def ocr_scontrino(file: UploadFile = File(...)):
    img_bytes = await file.read()
    img_b64 = base64.b64encode(img_bytes).decode("utf-8")
    image_url = f"data:{file.content_type};base64,{img_b64}"

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Estrai i prodotti con quantità e prezzo da questo scontrino "
                                "e restituisci solo il JSON nel seguente formato:\n"
                                "{\n"
                                "  \"prodotti\": [{\"nome\": ..., \"quantita\": ..., \"prezzo_unitario\": ...}],\n"
                                "  \"totale\": ...,\n"
                                "  \"data\": \"YYYY-MM-DD\"\n"
                                "}\n"
                                "Rispondi solo con un oggetto JSON valido, senza spiegazioni."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url}
                        }
                    ]
                }
            ],
            max_tokens=400
        )
        raw_content = response.choices[0].message.content.strip()
        parsed = extract_json(raw_content)
        validated = OCRResponse(**parsed)

        async with SessionLocal() as session:
            scontrino = Scontrino(data=validated.data, totale=validated.totale)
            session.add(scontrino)
            await session.flush()

            for p in validated.prodotti:
                prodotto = Prodotto(
                    nome=p.nome,
                    quantita=p.quantita,
                    prezzo_unitario=p.prezzo_unitario,
                    scontrino_id=scontrino.id
                )
                session.add(prodotto)

            await session.commit()

        return JSONResponse(content={"status": "ok", "data": validated.dict()})

    except (json.JSONDecodeError, ValidationError) as e:
        return JSONResponse(status_code=422, content={"status": "error", "error": str(e), "raw_response": raw_content})
    except SQLAlchemyError as db_err:
        return JSONResponse(status_code=500, content={"status": "error", "error": f"DB error: {str(db_err)}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "error": str(e)})


@app.get("/test-db")
async def test_db():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "message": "Connessione al database riuscita."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/test-db-schema")
async def test_db_schema():
    try:
        async with engine.begin() as conn:
            def inspect_tables(sync_conn):
                inspector = inspect(sync_conn)
                return inspector.get_table_names()
            tables = await conn.run_sync(inspect_tables)
        expected_tables = {"scontrini", "prodotti", "schemi_nutrizionali"}
        missing = list(expected_tables - set(tables))
        if missing:
            return {
                "status": "warning",
                "message": f"Tabelle mancanti: {missing}",
                "found_tables": tables
            }
        return {"status": "ok", "message": "Tutte le tabelle esistono.", "tables": tables}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/scontrini", response_model=List[ScontrinoOut])
async def get_scontrini():
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT id, data, totale FROM scontrini ORDER BY id DESC"))
        rows = result.fetchall()
        return [dict(row._mapping) for row in rows]


@app.get("/prodotti", response_model=List[ProdottoOut])
async def get_prodotti():
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT id, nome, quantita, prezzo_unitario, scontrino_id FROM prodotti ORDER BY id DESC"))
        rows = result.fetchall()
        return [dict(row._mapping) for row in rows]


@app.post("/prodotti", response_model=ProdottoOut)
async def crea_prodotto(prodotto: ProdottoModel):
    async with SessionLocal() as session:
        nuovo = Prodotto(
            nome=prodotto.nome,
            quantita=prodotto.quantita,
            prezzo_unitario=prodotto.prezzo_unitario,
            scontrino_id=None
        )
        session.add(nuovo)
        await session.commit()
        await session.refresh(nuovo)
    return nuovo


@app.delete("/prodotti/{id}")
async def delete_prodotto(id: int):
    try:
        async with SessionLocal() as session:
            prodotto = await session.get(Prodotto, id)
            if not prodotto:
                raise HTTPException(status_code=404, detail="Prodotto non trovato")
            await session.delete(prodotto)
            await session.commit()
        return {"status": "ok", "message": f"Prodotto con ID {id} eliminato."}
    except SQLAlchemyError as e:
        return {"status": "error", "message": str(e)}

import logging

logger = logging.getLogger("uvicorn.error")  # usa logger di uvicorn

@app.post("/ricette", response_model=RicettaOutput)
async def genera_ricette(payload: RicettaRequest = Body(...)):
    tipo_pasto = payload.tipo_pasto
    tipo_schema = payload.tipo_schema

    logger.debug(f"Richiesta ricetta: tipo_pasto='{tipo_pasto}', tipo_schema='{tipo_schema}'")

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
        logger.debug(f"Schema caricato: nome={schema['nome']}, calorie={schema['calorie']}, proteine={schema['proteine']}")
        
        dettagli = json.loads(schema['dettagli']) if schema['dettagli'] else {}

        if tipo_pasto not in dettagli:
            logger.error(f"Dettagli pasto '{tipo_pasto}' non trovati nello schema '{tipo_schema}'")
            raise HTTPException(status_code=404, detail=f"Nessun dettaglio trovato per tipo pasto '{tipo_pasto}' nello schema '{tipo_schema}'")

        dettagli_pasto = dettagli[tipo_pasto]
        logger.debug(f"dettagli_pasto di tipo '{tipo_pasto}': {type(dettagli_pasto)}")

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

    # Chiedi a GPT di mappare nomi alimenti schema con prodotti disponibili
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


@app.post("/init-db")
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return {"status": "ok", "message": "Tabelle create correttamente."}
