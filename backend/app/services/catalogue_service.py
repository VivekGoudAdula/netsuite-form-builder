from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..schemas.catalogue import CatalogueFieldCreate, CatalogueFieldUpdate

class CatalogueService:
    @staticmethod
    async def get_fields(db: AsyncIOMotorDatabase, trans_type: str) -> List[Dict[str, Any]]:
        cursor = db.field_catalogue.find({"transactionType": trans_type}).sort("displayOrder", 1)
        return await cursor.to_list(length=1000)

    @staticmethod
    async def get_grouped_catalogue(db: AsyncIOMotorDatabase, trans_type: str) -> Dict[str, Any]:
        fields = await CatalogueService.get_fields(db, trans_type)
        
        # Structure: Group by Tab -> Group for "body", and Tab -> subSection for "sublist"
        tabs_dict = {}
        
        for field in fields:
            # Map MongoDB _id to id string for frontend
            field["_id"] = str(field["_id"])
            tab_name = field.get("tab", "Main")
            section = field.get("section", "body")
            
            if tab_name not in tabs_dict:
                tabs_dict[tab_name] = {
                    "name": tab_name,
                    "groups": [],
                    "subSections": {}
                }
            
            if section == "body":
                group_name = field.get("group", "Standard Information")
                # Find or create group
                group = next((g for g in tabs_dict[tab_name]["groups"] if g["name"] == group_name), None)
                if not group:
                    group = {"name": group_name, "fields": []}
                    tabs_dict[tab_name]["groups"].append(group)
                group["fields"].append(field)
            
            elif section == "sublist":
                sub_section = field.get("subSection", "item")
                if sub_section not in tabs_dict[tab_name]["subSections"]:
                    tabs_dict[tab_name]["subSections"][sub_section] = []
                tabs_dict[tab_name]["subSections"][sub_section].append(field)

        # Stable PO line-item column order (Item → HSN → Qty → Rate → Tax → Amount)
        _item_order = [
            "item", "hsncode", "custcol_hsn_code", "quantity", "rate",
            "taxcode", "amount", "units", "description",
        ]
        for tab in tabs_dict.values():
            items = tab.get("subSections", {}).get("item")
            if items:

                def _rank(f: dict) -> int:
                    iid = (f.get("internalId") or "").lower()
                    try:
                        return _item_order.index(iid)
                    except ValueError:
                        return 999

                tab["subSections"]["item"] = sorted(items, key=_rank)

        # Convert dictionary to ordered list of tabs
        # Preferred order: Main, Items, Shipping, Billing, Tax Details
        preferred_order = ["Main", "Items", "Shipping", "Billing", "Tax Details"]
        
        sorted_tabs = []
        for name in preferred_order:
            if name in tabs_dict:
                sorted_tabs.append(tabs_dict[name])
                del tabs_dict[name]
        
        # Add any remaining tabs
        for tab in tabs_dict.values():
            sorted_tabs.append(tab)

        return {"tabs": sorted_tabs}

    @staticmethod
    async def bulk_import(db: AsyncIOMotorDatabase, fields: List[Dict[str, Any]]):
        if not fields:
            return
        
        # Optional: Add validation or mapping to schema here
        await db.field_catalogue.insert_many(fields)

    @staticmethod
    async def add_field(db: AsyncIOMotorDatabase, field_data: Dict[str, Any]):
        result = await db.field_catalogue.insert_one(field_data)
        return str(result.inserted_id)

    @staticmethod
    async def update_field(db: AsyncIOMotorDatabase, field_id: str, field_data: Dict[str, Any]):
        from bson import ObjectId
        await db.field_catalogue.update_one(
            {"_id": ObjectId(field_id)},
            {"$set": field_data}
        )
