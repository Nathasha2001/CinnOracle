def recommend_marketplaces(grade: str, district: str, quantity: float, price: float) -> list[str]:
    premium_grades = ["Alba", "C5 Special", "C5", "C4"]
    mid_grades = ["H1", "H2"]
    lower_grades = ["Heen", "Gorosu"]

    if grade in premium_grades:
        if quantity >= 100:
            return [
                f"{district} Cinnamon Market",
                "Export Auction Buyers",
                "Wholesale Export Buyers",
            ]
        return [
            f"{district} Premium Buyers",
            "Local Specialty Spice Buyers",
            "Regional Cinnamon Collectors",
        ]

    if grade in mid_grades:
        if quantity >= 100:
            return [
                f"{district} Wholesale Market",
                "Regional Traders",
                "Bulk Cinnamon Buyers",
            ]
        return [
            f"{district} Local Traders",
            "District Buying Centers",
        ]

    if grade in lower_grades:
        if quantity >= 100:
            return [
                "Processing Factories",
                "Industrial Spice Buyers",
                f"{district} Bulk Traders",
            ]
        return [
            f"{district} Local Traders",
            "Nearby Collecting Centers",
        ]

    return [f"{district} Local Traders"]
