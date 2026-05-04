MARKETPLACE_DATA = {
    "Galle": {
        "farmer_level": ["Elpitiya Local Cinnamon Collectors", "Baddegama Cinnamon Collection Points", "Ambalangoda Local Spice Traders", "Galle District Cinnamon Wholesale Market"],
        "large_scale": ["New Lanka Cinnamon Pvt Ltd - Karandeniya, Galle", "Galle Ceylon Spices International (Pvt) Ltd", "Kumara Cinnamon Exporters Pvt Ltd - Elpitiya", "New Lanka Cinnamon Pvt Ltd - Export Processing"]
    },
    "Matara": {
        "farmer_level": ["Akuressa Local Cinnamon Collectors", "Kamburupitiya Collection Centers", "Matara Local Spice Traders", "Akuressa Cinnamon Wholesale Buyers"],
        "large_scale": ["Samagi Spice Exports (Pvt) Ltd - Akuressa", "Samagi Organics (Pvt) Ltd - Akuressa", "EC Holdings Pvt Ltd - Nupe, Matara", "EDB Registered Cinnamon Exporters Network"]
    },
    "Hambantota": {
        "farmer_level": ["Hambantota Local Agricultural Market", "Village Cinnamon Collectors", "Local Spice Traders", "Hambantota District Wholesale Buyers"],
        "large_scale": ["Southern Province Processing Centers", "Bulk Cinnamon Buyers", "Processing Factories", "Colombo Export Hub"]
    },
    "Ratnapura": {
        "farmer_level": ["Ratnapura Local Spice Market", "Village Collection Centers", "Plantation-level Cinnamon Buyers", "Ratnapura District Wholesale Buyers"],
        "large_scale": ["Rathna Producers Cinnamon Exports Pvt Ltd", "Regional Processing Centers", "Bulk Cinnamon Traders", "EDB Registered Cinnamon Exporters Network"]
    },
    "Monaragala": {
        "farmer_level": ["Monaragala Local Agricultural Market", "Village Collection Centers", "Local Spice Traders", "Monaragala District Wholesale Buyers"],
        "large_scale": ["Regional Processing Centers", "Bulk Cinnamon Buyers", "Supply Chain Distributors", "Colombo Export Hub"]
    },
    "Gampaha": {
        "farmer_level": ["Gampaha Local Spice Traders", "Negombo Spice Market", "Village Collection Centers", "Gampaha Wholesale Buyers"],
        "large_scale": ["Western Province Processing Centers", "Export Packaging Centers", "Colombo Export Supply Chain Buyers", "EDB Registered Cinnamon Exporters Network"]
    },
    "Kurunegala": {
        "farmer_level": ["Kurunegala Local Spice Traders", "Village Collection Points", "Local Agricultural Market", "Kurunegala Wholesale Buyers"],
        "large_scale": ["Distribution Hubs", "Processing Centers", "Bulk Cinnamon Buyers", "Colombo Export Hub"]
    },
    "Colombo": {
        "farmer_level": ["Pettah Wholesale Spice Market", "Colombo Local Spice Traders", "Urban Wholesale Buyers", "Colombo District Wholesale Buyers"],
        "large_scale": ["A Baur & Co Pvt Ltd", "A H Spice Exports", "A S Chatoor & Co Ltd", "Adam Exports Pvt Ltd", "Adamjee Lukmanjee Exports Pvt Ltd", "Colombo Port Export Hub"]
    },
    "Badulla": {
        "farmer_level": ["Badulla Local Agricultural Market", "Village Collection Centers", "Local Spice Traders", "Badulla District Wholesale Buyers"],
        "large_scale": ["Regional Processing Centers", "Bulk Cinnamon Buyers", "Supply Chain Distributors", "Colombo Export Hub"]
    }
}

def classify_farmer_scale(harvest_quantity_kg):
    """
    Classifies the user based on harvest quantity.
    >= 500 kg -> large_scale
    < 500 kg -> farmer_level
    """
    if harvest_quantity_kg >= 500:
        return "large_scale"
    return "farmer_level"

def get_recommended_marketplaces(district: str, harvest_quantity_kg: float):
    """
    Returns a list of recommended marketplaces based on district and harvest scale.
    """
    category = classify_farmer_scale(harvest_quantity_kg)
    
    district_data = MARKETPLACE_DATA.get(district)
    
    if not district_data:
        # Fallback for unknown districts
        return ["EDB Registered Cinnamon Exporters Network", "Colombo Export Hub"]
    
    return district_data.get(category, [])
