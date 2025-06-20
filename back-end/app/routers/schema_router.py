from fastapi import APIRouter, HTTPException, Body
from typing import List
import json
import logging

from app.models.schema_models import SchemaNutrizionaleInput, SchemaNutrizionaleOut, DettagliPasto
from app.models.orm_models import SchemaNutrizionale
from app.database import SessionLocal
from sqlalchemy import text
from fastapi import Depends


router = APIRouter(prefix="/schemi-nutrizionali", tags=["schemi-nutrizionali"])
logger = logging.getLogger("uvicorn.error")

def normalizza_dettagli(raw_dettagli: dict) -> dict:
    normalized = {}
    for key, val in raw_dettagli.items():
        if isinstance(val, dict) and "opzioni" in val and isinstance(val["opzioni"], list):
            try:
                normalized[key] = DettagliPasto.parse_obj(val)
            except Exception:
                normalized[key] = DettagliPasto(opzioni=[])
        else:
            normalized[key] = DettagliPasto(opzioni=[])
    return normalized

@router.get("", response_model=List[SchemaNutrizionaleOut])
async def get_schemi():
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT * FROM schemi_nutrizionali ORDER BY id DESC"))
        rows = result.fetchall()
        schemi = []
        for row in rows:
            data = dict(row._mapping)
            if data.get('dettagli'):
                try:
                    dettagli_raw = json.loads(data['dettagli'])
                    data['dettagli'] = normalizza_dettagli(dettagli_raw)
                except Exception:
                    data['dettagli'] = {}
            else:
                data['dettagli'] = {}
            schemi.append(data)
        return schemi
    
@router.post("", response_model=List[SchemaNutrizionaleOut])
async def crea_schemi(schemi: List[SchemaNutrizionaleInput]):
    saved_schemi = []
    async with SessionLocal() as session:
        for schema in schemi:
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



@router.post("/dati-generali")
async def salva_dati_generali(payload: dict = Body(...)):
    nome = payload.get("nome")
    calorie = payload.get("calorie")
    carboidrati = payload.get("carboidrati")
    grassi = payload.get("grassi")
    proteine = payload.get("proteine")
    acqua = payload.get("acqua")
    is_modello = payload.get("is_modello", False)  # ✅

    if not all([nome, calorie, carboidrati, grassi, proteine, acqua]):
        raise HTTPException(status_code=400, detail="Tutti i campi sono obbligatori")

    async with SessionLocal() as session:
        existing = await session.execute(
            text("SELECT * FROM schemi_nutrizionali WHERE nome = :nome"),
            {"nome": nome}
        )
        existing_row = existing.first()

        if existing_row:
            db_schema = await session.get(SchemaNutrizionale, existing_row.id)
            db_schema.calorie = calorie
            db_schema.carboidrati = carboidrati
            db_schema.grassi = grassi
            db_schema.proteine = proteine
            db_schema.acqua = acqua
            db_schema.is_modello = is_modello
        else:
            db_schema = SchemaNutrizionale(
                nome=nome,
                calorie=calorie,
                carboidrati=carboidrati,
                grassi=grassi,
                proteine=proteine,
                acqua=acqua,
                is_modello=is_modello,  # ✅
                dettagli="{}"
            )
            session.add(db_schema)

        await session.commit()
        await session.refresh(db_schema)

    return {"status": "ok", "message": "Dati generali salvati con successo"}


@router.post("/dinamico/completo")
async def salva_schema_completo(payload: dict = Body(...)):
    nome = payload.get("nome")
    tipo_schema = payload.get("tipoSchema")
    tipo_pasto = payload.get("tipoPasto")
    dettagli = payload.get("dettagli")

    if not all([nome, tipo_schema, tipo_pasto, dettagli]):
        raise HTTPException(status_code=400, detail="Tutti i campi sono obbligatori")

    async with SessionLocal() as session:
        existing = await session.execute(
            text("SELECT * FROM schemi_nutrizionali WHERE nome = :nome"),
            {"nome": nome}
        )
        existing_row = existing.first()
        if not existing_row:
            raise HTTPException(status_code=404, detail="Schema nutrizionale non trovato")

        db_schema = await session.get(SchemaNutrizionale, existing_row.id)
        dettagli_dict = json.loads(db_schema.dettagli) if db_schema.dettagli else {}

        dettagli_dict[tipo_pasto] = dettagli
        db_schema.dettagli = json.dumps(dettagli_dict)

        await session.commit()
        await session.refresh(db_schema)

    return {"status": "ok", "message": "Schema completo salvato con successo"}

@router.post("/dinamico/pasto")
async def salva_singolo_pasto(payload: dict = Body(...)):
    nome = payload.get("nome")
    tipo_schema = payload.get("tipoSchema")
    tipo_pasto = payload.get("tipoPasto")
    dettagli = payload.get("dettagli")

    if not all([nome, tipo_schema, tipo_pasto, dettagli]):
        raise HTTPException(status_code=400, detail="Tutti i campi sono obbligatori")

    # ✅ Imposta "salvata": True in ogni opzione
    for opzione in dettagli.get("opzioni", []):
        opzione["salvata"] = True

    async with SessionLocal() as session:
        existing = await session.execute(
            text("SELECT * FROM schemi_nutrizionali WHERE nome = :nome"),
            {"nome": nome}
        )
        existing_row = existing.first()
        if not existing_row:
            raise HTTPException(status_code=404, detail="Schema nutrizionale non trovato")

        db_schema = await session.get(SchemaNutrizionale, existing_row.id)
        dettagli_dict = json.loads(db_schema.dettagli or '{}')

        # ✅ Sovrascrive solo le opzioni di quel tipo_pasto
        dettagli_dict[tipo_pasto] = dettagli

        db_schema.dettagli = json.dumps(dettagli_dict)
        await session.commit()
        await session.refresh(db_schema)

    return {"status": "ok", "message": "Dettagli pasto aggiornati con successo"}

@router.delete("/{id}")
async def elimina_schema(id: int):
    async with SessionLocal() as session:
        schema = await session.get(SchemaNutrizionale, id)
        if not schema:
            raise HTTPException(status_code=404, detail="Schema non trovato")
        await session.delete(schema)
        await session.commit()
    return {"status": "ok", "message": f"Schema con id {id} eliminato."}


@router.get("/{schema_id}")
async def get_schema(schema_id: int):
    async with SessionLocal() as session:
        db_schema = await session.get(SchemaNutrizionale, schema_id)
        if not db_schema:
            raise HTTPException(status_code=404, detail="Schema non trovato")

        data = db_schema.__dict__.copy()
        if data.get("dettagli"):
            try:
                data["dettagli"] = json.loads(data["dettagli"])
            except Exception:
                data["dettagli"] = {}
        else:
            data["dettagli"] = {}

        return data


@router.delete("/{schema_id}/opzione/{tipo_pasto}/{opzione_id}/")
async def elimina_opzione_per_id(schema_id: int, tipo_pasto: str, opzione_id: str):
    async with SessionLocal() as session:
        db_schema = await session.get(SchemaNutrizionale, schema_id)
        if not db_schema:
            raise HTTPException(status_code=404, detail="Schema non trovato")

        dettagli_dict = json.loads(db_schema.dettagli or '{}')

        if tipo_pasto not in dettagli_dict:
            raise HTTPException(status_code=404, detail="Tipo pasto non trovato")

        opzioni = dettagli_dict[tipo_pasto].get("opzioni", [])
        nuove_opzioni = [op for op in opzioni if op.get("id") != opzione_id]

        if len(opzioni) == len(nuove_opzioni):
            raise HTTPException(status_code=404, detail="Opzione non trovata")

        dettagli_dict[tipo_pasto]["opzioni"] = nuove_opzioni
        db_schema.dettagli = json.dumps(dettagli_dict)

        await session.commit()
        return {"status": "ok", "message": "Opzione rimossa"}




@router.get("/schema/modelli", response_model=List[SchemaNutrizionaleOut])
async def getModelli():
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT * FROM schemi_nutrizionali ORDER BY id DESC"))
        rows = result.fetchall()
        schemi = []
        for row in rows:
            data = dict(row._mapping)
            if data.get('dettagli'):
                try:
                    dettagli_raw = json.loads(data['dettagli'])
                    data['dettagli'] = normalizza_dettagli(dettagli_raw)
                except Exception:
                    data['dettagli'] = {}
            else:
                data['dettagli'] = {}
            
            if data.get("is_modello", False):
                schemi.append(data)

        return schemi
