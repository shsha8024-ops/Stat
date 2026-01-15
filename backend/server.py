from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import uuid

app = FastAPI(title="الغدير نقل و تخليص API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.alghadeer_db

# Collections
clients_collection = db.clients
invoices_collection = db.invoices
statements_collection = db.statements

# Pydantic Models
class Client(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: f"client_{uuid.uuid4().hex[:12]}")
    name: str
    phone: str
    location: str
    currency: str = "$"
    createdAt: Optional[float] = Field(default_factory=lambda: datetime.now().timestamp() * 1000)

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    currency: Optional[str] = None

class Invoice(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    clientId: str
    name: str
    date: str
    createdAt: Optional[float] = Field(default_factory=lambda: datetime.now().timestamp() * 1000)

class InvoiceUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None

class Statement(BaseModel):
    invoiceId: str
    meta: Dict[str, Any]
    t1: Dict[str, Any]
    t2: Dict[str, Any]

# API Routes
@app.get("/")
async def root():
    return {"message": "الغدير نقل و تخليص API", "status": "running"}

# Clients Endpoints
@app.get("/api/clients")
async def get_clients():
    clients = await clients_collection.find().to_list(1000)
    for client in clients:
        client["_id"] = str(client["_id"])
    return clients

@app.post("/api/clients")
async def create_client(client: Client):
    client_dict = client.dict()
    result = await clients_collection.insert_one(client_dict)
    client_dict["_id"] = str(result.inserted_id)
    
    # Create first invoice for new client
    first_invoice = Invoice(
        clientId=client_dict["id"],
        name="فاتورة 1",
        date=datetime.now().strftime("%Y-%m-%d")
    )
    invoice_dict = first_invoice.dict()
    await invoices_collection.insert_one(invoice_dict)
    
    # Create default statement
    default_statement = Statement(
        invoiceId=invoice_dict["id"],
        meta={
            "currency": client.currency,
            "invoiceName": first_invoice.name,
            "date": first_invoice.date,
            "period": "مفتوحة"
        },
        t1={
            "headerTitles": ["رقم", "التاريخ", "اسم السائق", "رقم السيارة", "ملاحظة", "المبلغ"],
            "rows": [["1", "", "", "", "", f"0{client.currency}"]]
        },
        t2={
            "headerTitles": ["رقم", "التاريخ", "اسم السائق", "رقم السيارة", "ملاحظة", "المبلغ"],
            "rows": [["1", "", "", "", "", f"0{client.currency}"]]
        }
    )
    await statements_collection.insert_one(default_statement.dict())
    
    return client_dict

@app.get("/api/clients/{client_id}")
async def get_client(client_id: str):
    client = await clients_collection.find_one({"id": client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    client["_id"] = str(client["_id"])
    return client

@app.put("/api/clients/{client_id}")
async def update_client(client_id: str, client_update: ClientUpdate):
    update_data = {k: v for k, v in client_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await clients_collection.update_one(
        {"id": client_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = await clients_collection.find_one({"id": client_id})
    client["_id"] = str(client["_id"])
    return client

@app.delete("/api/clients/{client_id}")
async def delete_client(client_id: str):
    # Delete client
    result = await clients_collection.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Delete all invoices
    invoices = await invoices_collection.find({"clientId": client_id}).to_list(1000)
    invoice_ids = [inv["id"] for inv in invoices]
    
    await invoices_collection.delete_many({"clientId": client_id})
    await statements_collection.delete_many({"invoiceId": {"$in": invoice_ids}})
    
    return {"message": "Client deleted successfully"}

# Invoices Endpoints
@app.get("/api/clients/{client_id}/invoices")
async def get_client_invoices(client_id: str):
    invoices = await invoices_collection.find({"clientId": client_id}).to_list(1000)
    for invoice in invoices:
        invoice["_id"] = str(invoice["_id"])
    return invoices

@app.post("/api/clients/{client_id}/invoices")
async def create_invoice(client_id: str, invoice: Invoice):
    # Check if client exists
    client = await clients_collection.find_one({"id": client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    invoice.clientId = client_id
    invoice_dict = invoice.dict()
    await invoices_collection.insert_one(invoice_dict)
    
    # Create default statement
    default_statement = Statement(
        invoiceId=invoice_dict["id"],
        meta={
            "currency": client["currency"],
            "invoiceName": invoice.name,
            "date": invoice.date,
            "period": "مفتوحة"
        },
        t1={
            "headerTitles": ["رقم", "التاريخ", "اسم السائق", "رقم السيارة", "ملاحظة", "المبلغ"],
            "rows": [["1", "", "", "", "", f"0{client['currency']}"]]
        },
        t2={
            "headerTitles": ["رقم", "التاريخ", "اسم السائق", "رقم السيارة", "ملاحظة", "المبلغ"],
            "rows": [["1", "", "", "", "", f"0{client['currency']}"]]
        }
    )
    await statements_collection.insert_one(default_statement.dict())
    
    invoice_dict["_id"] = str(invoice_dict.get("_id", ""))
    return invoice_dict

@app.get("/api/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    invoice = await invoices_collection.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice["_id"] = str(invoice["_id"])
    return invoice

@app.put("/api/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, invoice_update: InvoiceUpdate):
    update_data = {k: v for k, v in invoice_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await invoices_collection.update_one(
        {"id": invoice_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Update statement meta
    if "name" in update_data:
        await statements_collection.update_one(
            {"invoiceId": invoice_id},
            {"$set": {"meta.invoiceName": update_data["name"]}}
        )
    if "date" in update_data:
        await statements_collection.update_one(
            {"invoiceId": invoice_id},
            {"$set": {"meta.date": update_data["date"]}}
        )
    
    invoice = await invoices_collection.find_one({"id": invoice_id})
    invoice["_id"] = str(invoice["_id"])
    return invoice

@app.delete("/api/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str):
    # Get invoice to find client
    invoice = await invoices_collection.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    client_id = invoice["clientId"]
    
    # Delete invoice and statement
    await invoices_collection.delete_one({"id": invoice_id})
    await statements_collection.delete_one({"invoiceId": invoice_id})
    
    # Check if client has any invoices left
    remaining_invoices = await invoices_collection.count_documents({"clientId": client_id})
    
    # If no invoices left, create a default one
    if remaining_invoices == 0:
        client = await clients_collection.find_one({"id": client_id})
        if client:
            first_invoice = Invoice(
                clientId=client_id,
                name="فاتورة 1",
                date=datetime.now().strftime("%Y-%m-%d")
            )
            invoice_dict = first_invoice.dict()
            await invoices_collection.insert_one(invoice_dict)
            
            default_statement = Statement(
                invoiceId=invoice_dict["id"],
                meta={
                    "currency": client["currency"],
                    "invoiceName": first_invoice.name,
                    "date": first_invoice.date,
                    "period": "مفتوحة"
                },
                t1={
                    "headerTitles": ["رقم", "التاريخ", "اسم السائق", "رقم السيارة", "ملاحظة", "المبلغ"],
                    "rows": [["1", "", "", "", "", f"0{client['currency']}"]]
                },
                t2={
                    "headerTitles": ["رقم", "التاريخ", "اسم السائق", "رقم السيارة", "ملاحظة", "المبلغ"],
                    "rows": [["1", "", "", "", "", f"0{client['currency']}"]]
                }
            )
            await statements_collection.insert_one(default_statement.dict())
    
    return {"message": "Invoice deleted successfully"}

# Statement Endpoints
@app.get("/api/invoices/{invoice_id}/statement")
async def get_statement(invoice_id: str):
    statement = await statements_collection.find_one({"invoiceId": invoice_id})
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    statement["_id"] = str(statement["_id"])
    return statement

@app.put("/api/invoices/{invoice_id}/statement")
async def update_statement(invoice_id: str, statement: Statement):
    statement_dict = statement.dict()
    
    result = await statements_collection.update_one(
        {"invoiceId": invoice_id},
        {"$set": statement_dict},
        upsert=True
    )
    
    return {"message": "Statement updated successfully"}

# Reports Endpoint
@app.get("/api/reports")
async def get_reports():
    clients = await clients_collection.find().to_list(1000)
    reports = []
    
    for client in clients:
        client["_id"] = str(client["_id"])
        invoices = await invoices_collection.find({"clientId": client["id"]}).to_list(1000)
        
        total_operations = 0
        total_payments = 0
        
        for invoice in invoices:
            statement = await statements_collection.find_one({"invoiceId": invoice["id"]})
            if statement:
                # Calculate operations total
                for row in statement.get("t1", {}).get("rows", []):
                    if row:
                        amount_str = str(row[-1]) if len(row) > 0 else "0"
                        amount = float(''.join(filter(lambda x: x.isdigit() or x == '.', amount_str)) or 0)
                        total_operations += amount
                
                # Calculate payments total
                for row in statement.get("t2", {}).get("rows", []):
                    if row:
                        amount_str = str(row[-1]) if len(row) > 0 else "0"
                        amount = float(''.join(filter(lambda x: x.isdigit() or x == '.', amount_str)) or 0)
                        total_payments += amount
        
        balance = total_operations - total_payments
        
        reports.append({
            "client": client,
            "invoiceCount": len(invoices),
            "balance": f"{balance}{client.get('currency', '$')}"
        })
    
    return reports

# Backup Endpoint
@app.get("/api/backup")
async def get_backup():
    clients = await clients_collection.find().to_list(1000)
    invoices = await invoices_collection.find().to_list(1000)
    statements = await statements_collection.find().to_list(1000)
    
    for client in clients:
        client["_id"] = str(client["_id"])
    for invoice in invoices:
        invoice["_id"] = str(invoice["_id"])
    for statement in statements:
        statement["_id"] = str(statement["_id"])
    
    return {
        "clients": clients,
        "invoices": invoices,
        "statements": statements
    }

@app.post("/api/restore")
async def restore_backup(backup: Dict[str, Any]):
    # Clear existing data
    await clients_collection.delete_many({})
    await invoices_collection.delete_many({})
    await statements_collection.delete_many({})
    
    # Restore data
    if backup.get("clients"):
        for client in backup["clients"]:
            if "_id" in client:
                del client["_id"]
        await clients_collection.insert_many(backup["clients"])
    
    if backup.get("invoices"):
        for invoice in backup["invoices"]:
            if "_id" in invoice:
                del invoice["_id"]
        await invoices_collection.insert_many(backup["invoices"])
    
    if backup.get("statements"):
        for statement in backup["statements"]:
            if "_id" in statement:
                del statement["_id"]
        await statements_collection.insert_many(backup["statements"])
    
    return {"message": "Backup restored successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
