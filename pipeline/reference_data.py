"""
Static reference data + calibration for the KSP synthetic dataset.

Everything here is either (a) real public reference data — Karnataka districts,
Bengaluru police-station locations, IPC/BNS sections — or (b) calibration
weights approximating the distributions in KSP's published Monthly Crime Reviews
(Bengaluru-dominant volume; property crime the largest head). No records are
invented as "real"; this is the scaffolding the generator populates against the
supplied ER schema.
"""

# --- State ------------------------------------------------------------------
STATE = (1, "Karnataka", 1)

# --- Districts (real Karnataka districts) with rough case-volume weights -----
# Weights approximate published relative crime volumes (Bengaluru City highest).
DISTRICTS = [
    # (id, name, weight)
    (1, "Bengaluru City", 100),
    (2, "Bengaluru Rural", 14),
    (3, "Mysuru", 22),
    (4, "Mangaluru (D.K.)", 18),
    (5, "Belagavi", 20),
    (6, "Kalaburagi", 16),
    (7, "Hubballi-Dharwad", 17),
    (8, "Tumakuru", 12),
    (9, "Ballari", 13),
    (10, "Vijayapura", 11),
    (11, "Shivamogga", 12),
    (12, "Davanagere", 11),
    (13, "Udupi", 9),
    (14, "Hassan", 9),
    (15, "Mandya", 9),
    (16, "Raichur", 10),
    (17, "Kolar", 9),
    (18, "Chitradurga", 8),
    (19, "Bagalkote", 8),
    (20, "Koppal", 7),
]

# District centroids (lat, lng) for placing incidents when not Bengaluru City.
DISTRICT_CENTROID = {
    1: (12.9716, 77.5946), 2: (13.2846, 77.6100), 3: (12.2958, 76.6394),
    4: (12.9141, 74.8560), 5: (15.8497, 74.4977), 6: (17.3297, 76.8343),
    7: (15.3647, 75.1240), 8: (13.3379, 77.1173), 9: (15.1394, 76.9214),
    10: (16.8302, 75.7100), 11: (13.9299, 75.5681), 12: (14.4644, 75.9218),
    13: (13.3409, 74.7421), 14: (13.0072, 76.0962), 15: (12.5223, 76.8954),
    16: (16.2076, 77.3463), 17: (13.1357, 78.1291), 18: (14.2251, 76.3980),
    19: (16.1691, 75.6615), 20: (15.3547, 76.1548),
}

# --- Bengaluru City: divisions -> police stations with real approx coords ----
# Division names form the ParentUnit tree beneath Bengaluru City.
BENGALURU_DIVISIONS = [
    "Bengaluru South Division",
    "Bengaluru North Division",
    "Bengaluru East Division",
    "Bengaluru West Division",
    "Bengaluru Central Division",
]

# (station name, division index, lat, lng, weight)
BENGALURU_STATIONS = [
    ("Jayanagar PS", 0, 12.9308, 77.5838, 30),
    ("JP Nagar PS", 0, 12.9063, 77.5857, 26),
    ("Banashankari PS", 0, 12.9255, 77.5468, 22),
    ("Basavanagudi PS", 0, 12.9420, 77.5730, 20),
    ("VV Puram PS", 0, 12.9490, 77.5730, 16),
    ("Girinagar PS", 0, 12.9390, 77.5380, 14),
    ("Yelahanka PS", 1, 13.1007, 77.5963, 14),
    ("Hebbal PS", 1, 13.0358, 77.5970, 15),
    ("RT Nagar PS", 1, 13.0230, 77.5940, 13),
    ("Peenya PS", 3, 13.0280, 77.5190, 16),
    ("Rajajinagar PS", 3, 12.9910, 77.5550, 15),
    ("Vijayanagar PS", 3, 12.9720, 77.5330, 14),
    ("Whitefield PS", 2, 12.9698, 77.7500, 18),
    ("Marathahalli PS", 2, 12.9560, 77.7010, 17),
    ("Indiranagar PS", 2, 12.9719, 77.6412, 16),
    ("Commercial St PS", 4, 12.9827, 77.6090, 13),
    ("Cubbon Park PS", 4, 12.9760, 77.5920, 10),
    ("Chickpet PS", 4, 12.9680, 77.5760, 12),
]

# --- Crime heads and sub-heads ----------------------------------------------
# (CrimeHeadID, group name)
CRIME_HEADS = [
    (1, "Crimes Against Property"),
    (2, "Crimes Against Body"),
    (3, "Crimes Against Women"),
    (4, "Economic Offences"),
    (5, "Other IPC/BNS Crimes"),
]

# (SubHeadID, HeadID, name, weight, gravity[H/N], primary act, section)
CRIME_SUBHEADS = [
    (1, 1, "Theft", 34, "N", "IPC", "379"),
    (2, 1, "Robbery", 12, "H", "IPC", "392"),
    (3, 1, "Burglary", 11, "N", "IPC", "457"),
    (4, 1, "Vehicle Theft", 9, "N", "IPC", "379"),
    (5, 1, "Chain Snatching", 5, "H", "IPC", "356"),
    (6, 2, "Assault", 9, "N", "IPC", "324"),
    (7, 2, "Hurt", 5, "N", "IPC", "323"),
    (8, 2, "Murder", 2, "H", "IPC", "302"),
    (9, 2, "Attempt to Murder", 2, "H", "IPC", "307"),
    (10, 3, "Harassment", 4, "N", "IPC", "354"),
    (11, 3, "Dowry Offences", 2, "H", "IPC", "498A"),
    (12, 4, "Cheating", 3, "N", "IPC", "420"),
    (13, 4, "Criminal Breach of Trust", 2, "N", "IPC", "406"),
    (14, 5, "Public Nuisance", 3, "N", "IPC", "268"),
    (15, 5, "Trespass", 3, "N", "IPC", "441"),
]

# --- Acts (IPC pre-2024, BNS from 01 Jul 2024) ------------------------------
ACTS = [
    ("IPC", "Indian Penal Code, 1860", "IPC"),
    ("BNS", "Bharatiya Nyaya Sanhita, 2023", "BNS"),
    ("NDPS", "Narcotic Drugs and Psychotropic Substances Act", "NDPS"),
    ("MVAct", "Motor Vehicles Act", "MV Act"),
]

# IPC section -> BNS equivalent (the real 2024 renumbering, principal ones)
IPC_TO_BNS = {
    "302": "103", "307": "109", "323": "115", "324": "118", "354": "74",
    "356": "302", "379": "303", "392": "309", "406": "316", "420": "318",
    "441": "329", "457": "331", "498A": "85", "268": "270", "323b": "115",
}

# --- Lookups ----------------------------------------------------------------
CASE_CATEGORIES = [(1, "FIR"), (2, "UDR"), (3, "PAR"), (4, "Zero FIR")]
GRAVITY = [(1, "Heinous"), (2, "Non-Heinous")]
CASE_STATUSES = [
    (1, "FIR Registered"), (2, "Under Investigation"),
    (3, "Charge Sheeted"), (4, "Closed"),
]
OCCUPATIONS = [
    (1, "Daily Wage Labourer"), (2, "Farmer"), (3, "Private Employee"),
    (4, "Government Employee"), (5, "Business"), (6, "Student"),
    (7, "Unemployed"), (8, "Driver"), (9, "Homemaker"), (10, "Self-Employed"),
]
RELIGIONS = [(1, "Hindu"), (2, "Muslim"), (3, "Christian"), (4, "Jain"), (5, "Other")]
CASTES = [
    (1, "General"), (2, "OBC"), (3, "SC"), (4, "ST"), (5, "Not Stated"),
]

# --- Org structure lookups --------------------------------------------------
UNIT_TYPES = [
    (1, "State Police", "State", 1),
    (2, "City Commissionerate", "City", 2),
    (3, "Division", "City", 3),
    (4, "Police Station", "City", 4),
    (5, "District Unit", "District", 3),
]
RANKS = [
    (1, "DGP", 1), (2, "IGP", 2), (3, "DIG", 3), (4, "SP", 4),
    (5, "ASP", 5), (6, "DySP", 6), (7, "Inspector", 7),
    (8, "Sub-Inspector", 8), (9, "ASI", 9), (10, "Head Constable", 10),
]
DESIGNATIONS = [
    (1, "Director General of Police", 1), (2, "Commissioner", 2),
    (3, "Deputy Commissioner", 3), (4, "Assistant Commissioner", 4),
    (5, "Station House Officer", 5), (6, "Investigating Officer", 6),
]

# --- Courts -----------------------------------------------------------------
COURTS = [
    "City Civil & Sessions Court, Bengaluru",
    "MMTC Court, Bengaluru",
    "JMFC Court, Jayanagar",
    "District & Sessions Court",
]

# --- Name pools (common Karnataka names) ------------------------------------
# Large enough that distinct persons get distinct canonical names — so that name
# similarity signals a spelling variant of ONE person, not a coincidental
# namesake (which the schema gives no way to disambiguate).
FIRST_NAMES_M = [
    "Ravi", "Suresh", "Manjunath", "Kiran", "Prakash", "Ramesh", "Naveen",
    "Anil", "Vijay", "Santhosh", "Arun", "Mahesh", "Girish", "Harish",
    "Lokesh", "Deepak", "Sandeep", "Raghu", "Basavaraj", "Shivakumar",
    "Nagaraj", "Chandru", "Vinod", "Praveen", "Yogesh", "Imran", "Vikram",
    "Rohit", "Ashok", "Gopal", "Umesh", "Srinivas", "Madhu", "Ganesh",
    "Kumar", "Kishore", "Nithin", "Rakesh", "Sagar", "Tejas", "Vinay",
    "Abhishek", "Bharath", "Chetan", "Darshan", "Eshwar", "Gagan", "Hemanth",
    "Jagadish", "Karthik", "Mahadev", "Nandan", "Pavan", "Rahul", "Sunil",
    "Anand", "Balaraj", "Dinesh", "Guru", "Jayaram", "Krishna", "Lingaraj",
    "Mohan", "Nataraj", "Puttaraj", "Ranganath", "Shankar", "Venkatesh",
    "Yashwanth", "Bhaskar", "Devaraj", "Gireesh", "Hanumantha", "Ibrahim",
    "Kariyappa", "Malleshi", "Narayan", "Onkar", "Parashuram", "Rajesh",
    "Siddappa", "Thimmappa", "Veeresh", "Zameer", "Faizal", "Riyaz",
    "Shabbir", "Tanveer", "Wasim", "Altaf", "Noor", "Salman", "Javed",
]
FIRST_NAMES_F = [
    "Lakshmi", "Geetha", "Savitha", "Ananya", "Divya", "Pooja", "Kavya",
    "Nisha", "Roopa", "Shobha", "Meena", "Sushma", "Rekha", "Ayesha",
    "Bhavya", "Chaitra", "Deepa", "Gowri", "Hema", "Jyothi", "Kalpana",
    "Manasa", "Nayana", "Padma", "Ramya", "Sahana", "Tara", "Varsha",
    "Yamuna", "Aruna", "Bhagya", "Chandana", "Fathima", "Nazma", "Sana",
]
SURNAMES = [
    "Kumar", "Gowda", "Reddy", "Shetty", "Rao", "Patil", "Naik", "Hegde",
    "Murthy", "Prasad", "Sharma", "Bhat", "Achar", "Setty", "Nayak",
    "Kulkarni", "Desai", "Pujari", "Swamy", "Raju", "Das", "Ali", "Khan",
    "Poojary", "Shenoy", "Kamath", "Pai", "Bhandari", "Acharya", "Holla",
    "Ballal", "Rai", "Karkera", "Suvarna", "Salian", "Devadiga", "Kotian",
    "Aithal", "Adiga", "Jain", "Baig", "Pasha", "Sait", "Hussain", "Ahmed",
    "Gouda", "Hiremath", "Angadi", "Badiger", "Chavan", "Deshpande",
    "Gadag", "Jadhav", "Koppad", "Math", "Nadgir", "Savadi", "Tapal",
]


def transliteration_variants(canonical):
    """
    Plausible spelling variants of a Kannada-transliterated name — how the same
    person's name drifts across FIRs, which is what makes exact-name joins fail
    and entity resolution necessary.

    Deliberately excludes bare single-initial forms ("Ravi K."): in real data
    those exist but are genuinely ambiguous (they match many namesakes), so
    inventing them would just manufacture unresolvable noise. The variants here
    preserve enough signal that the same person clusters while distinct persons
    stay apart.
    """
    parts = canonical.split()
    out = {canonical}
    if len(parts) >= 2:
        first, last = parts[0], parts[-1]
        # joined (no space)
        out.add(first + last)
        # trailing 'a' on the surname (consonant-ending transliteration)
        out.add(f"{first} {last}a")
        out.add(f"{first}{last}a")
        # trailing 'a' on the first name
        out.add(f"{first}a {last}")
        # th <-> t drift
        if "th" in last.lower():
            out.add(f"{first} {last.replace('th', 't').replace('Th', 'T')}")
        if "th" in first.lower():
            out.add(f"{first.replace('th', 't').replace('Th', 'T')} {last}")
        # double-letter drift
        d = f"{first} {last}".replace("dd", "d").replace("nn", "n").replace("ll", "l")
        out.add(d)
    else:
        out.add(canonical + "a")
    return [v for v in out if v.strip()]
