from fastapi import APIRouter
from typing import List, Dict

router = APIRouter(prefix="/mock", tags=["mock"])

@router.get("/customers", response_model=List[Dict[str, str]])
async def get_mock_customers():
    return [
        { "id": "cust_1", "name": "HDFC Bank" },
        { "id": "cust_2", "name": "TCS" },
        { "id": "cust_3", "name": "Infosys" },
        { "id": "cust_4", "name": "Reliance Industries" },
        { "id": "cust_5", "name": "Wipro" }
    ]

@router.get("/employees", response_model=List[Dict[str, str]])
async def get_mock_employees():
    return [
        { "id": "emp_1", "name": "Vivek Goud" },
        { "id": "emp_2", "name": "Rahul Sharma" },
        { "id": "emp_3", "name": "Priyanka Chopra" },
        { "id": "emp_4", "name": "Anil Ambani" }
    ]

@router.get("/vendors", response_model=List[Dict[str, str]])
async def get_mock_vendors():
    return [
        { "id": "vend_1", "name": "Amazon Web Services" },
        { "id": "vend_2", "name": "Microsoft Azure" },
        { "id": "vend_3", "name": "Google Cloud" },
        { "id": "vend_4", "name": "Oracle" }
    ]

@router.get("/subsidiaries", response_model=List[Dict[str, str]])
async def get_mock_subsidiaries():
    return [
        { "id": "1", "name": "Ultrion Tech India" },
        { "id": "2", "name": "Ultrion Tech USA" },
        { "id": "3", "name": "Ultrion Tech UK" }
    ]

@router.get("/departments", response_model=List[Dict[str, str]])
async def get_mock_departments():
    return [
        { "id": "1", "name": "Engineering" },
        { "id": "2", "name": "Sales" },
        { "id": "3", "name": "Marketing" },
        { "id": "4", "name": "Human Resources" }
    ]

@router.get("/classifications", response_model=List[Dict[str, str]])
async def get_mock_classifications():
    return [
        { "id": "1", "name": "Software Development" },
        { "id": "2", "name": "Cloud Operations" },
        { "id": "3", "name": "Consulting" }
    ]

@router.get("/locations", response_model=List[Dict[str, str]])
async def get_mock_locations():
    return [
        { "id": "1", "name": "Hyderabad" },
        { "id": "2", "name": "Bangalore" },
        { "id": "3", "name": "San Francisco" }
    ]

@router.get("/currencies", response_model=List[Dict[str, str]])
async def get_mock_currencies():
    return [
        { "id": "1", "name": "INR" },
        { "id": "2", "name": "USD" },
        { "id": "3", "name": "EUR" },
        { "id": "4", "name": "GBP" }
    ]

@router.get("/terms", response_model=List[Dict[str, str]])
async def get_mock_terms():
    return [
        { "id": "1", "name": "Net 30" },
        { "id": "2", "name": "Net 60" },
        { "id": "3", "name": "Due on Receipt" }
    ]

@router.get("/approval-status", response_model=List[Dict[str, str]])
async def get_mock_approval_status():
    return [
        { "id": "1", "name": "Pending Approval" },
        { "id": "2", "name": "Approved" },
        { "id": "3", "name": "Rejected" }
    ]

@router.get("/shipping-methods", response_model=List[Dict[str, str]])
async def get_mock_shipping_methods():
    return [
        { "id": "1", "name": "UPS Ground" },
        { "id": "2", "name": "FedEx Express" },
        { "id": "3", "name": "DHL International" }
    ]

@router.get("/transactions", response_model=List[Dict[str, str]])
async def get_mock_transactions():
    return [
        { "id": "1", "name": "Purchase Order #101" },
        { "id": "2", "name": "Sales Order #505" },
        { "id": "3", "name": "Bill #909" }
    ]

@router.get("/custom-forms", response_model=List[Dict[str, str]])
async def get_mock_custom_forms():
    return [
        { "id": "1", "name": "Standard Purchase Order" },
        { "id": "2", "name": "Standard Sales Order" },
        { "id": "3", "name": "Custom Product Configurator" }
    ]

@router.get("/nexuses", response_model=List[Dict[str, str]])
async def get_mock_nexuses():
    return [
        { "id": "1", "name": "California - NY" },
        { "id": "2", "name": "India - Telangana" },
        { "id": "3", "name": "UK - London" }
    ]

@router.get("/intercompany-statuses", response_model=List[Dict[str, str]])
async def get_mock_intercompany_statuses():
    return [
        { "id": "1", "name": "Paired" },
        { "id": "2", "name": "Unpaired" },
        { "id": "3", "name": "Pending Elimination" }
    ]

@router.get("/purchase-contracts", response_model=List[Dict[str, str]])
async def get_mock_purchase_contracts():
    return [
        { "id": "1", "name": "Global Supply Agreement v1" },
        { "id": "2", "name": "Regional Office Supplies v2" }
    ]

@router.get("/addresses", response_model=List[Dict[str, str]])
async def get_mock_addresses():
    return [
        { "id": "1", "name": "123 Business Way, New York, NY" },
        { "id": "2", "name": "456 Corporate Dr, San Francisco, CA" },
        { "id": "3", "name": "789 Enterprise Lane, London, UK" }
    ]
