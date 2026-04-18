from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017')
db = client.netsuite_form_builder
form_id = '69e32c9dc132afd7ad3fa377'

print(f"Fixing form {form_id}...")
result = db.forms.update_one(
    {'_id': ObjectId(form_id)},
    {'$set': {
        'structure': {
            'tabs': [{
                'name': 'General',
                'visible': True,
                'fieldGroups': [{
                    'id': 'group_fix_system',
                    'name': 'Primary Information',
                    'fields': []
                }]
            }]
        }
    }}
)
print(f"Matched: {result.matched_count}, Modified: {result.modified_count}")
