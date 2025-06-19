from pydantic import BaseModel
from typing import Optional, List, Dict

class Alimento(BaseModel):
    nome: str
    quantita: str
    macronutriente: str

class GruppoAlimenti(BaseModel):
    alimenti: List[Alimento]

class Opzione(BaseModel):
    id: Optional[str] = None
    opzione: int
    gruppi_alimenti: List[GruppoAlimenti]
    salvata: bool = True
    
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
    quantita_grammi: Optional[float] = None
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

class IngredienteUpdate(BaseModel):
    nome: str
    quantita: str  # es. "150 gr", "2 pezzi"
