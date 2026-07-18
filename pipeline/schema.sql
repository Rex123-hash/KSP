-- ============================================================================
-- KSP Crime Intelligence Platform — database schema
--
-- Faithful to the supplied ER diagram (Police_FIR_ER_Diagram.pdf). Table and
-- column names mirror the design document so the generated data conforms to the
-- dataset KSP handed teams. SQLite types for the portable local build; the same
-- shape maps onto Catalyst Data Store.
--
-- Sections:
--   1. Reference / lookup tables
--   2. Org structure (the command tree)
--   3. Legal (acts, sections, crime heads)
--   4. Case core (FIR + parties + arrests + chargesheet)
--   5. Derived: entity resolution output
--   6. Derived: precomputed analytics
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- 1. Reference / lookup
-- ---------------------------------------------------------------------------
CREATE TABLE State (
  StateID       INTEGER PRIMARY KEY,
  StateName     TEXT NOT NULL,
  NationalityID INTEGER,
  Active        INTEGER DEFAULT 1
);

CREATE TABLE District (
  DistrictID   INTEGER PRIMARY KEY,
  DistrictName TEXT NOT NULL,
  StateID      INTEGER REFERENCES State(StateID),
  Active        INTEGER DEFAULT 1
);

CREATE TABLE CaseCategory (
  CaseCategoryID INTEGER PRIMARY KEY,
  LookupValue    TEXT NOT NULL          -- FIR, UDR, PAR, Zero FIR
);

CREATE TABLE GravityOffence (
  GravityOffenceID INTEGER PRIMARY KEY,
  LookupValue      TEXT NOT NULL         -- Heinous, Non-Heinous
);

CREATE TABLE CaseStatusMaster (
  CaseStatusID   INTEGER PRIMARY KEY,
  CaseStatusName TEXT NOT NULL           -- Under Investigation, Charge Sheeted, Closed
);

CREATE TABLE OccupationMaster (
  OccupationID   INTEGER PRIMARY KEY,
  OccupationName TEXT NOT NULL
);

CREATE TABLE ReligionMaster (
  ReligionID   INTEGER PRIMARY KEY,
  ReligionName TEXT NOT NULL
);

CREATE TABLE CasteMaster (
  caste_master_id   INTEGER PRIMARY KEY,
  caste_master_name TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 2. Org structure — the command tree
-- ---------------------------------------------------------------------------
CREATE TABLE UnitType (
  UnitTypeID    INTEGER PRIMARY KEY,
  UnitTypeName  TEXT NOT NULL,           -- Police Station, Circle Office, ...
  CityDistState TEXT,                    -- City / District / State
  Hierarchy     INTEGER,                 -- lower = higher authority
  Active        INTEGER DEFAULT 1
);

CREATE TABLE Unit (
  UnitID        INTEGER PRIMARY KEY,
  UnitName      TEXT NOT NULL,
  TypeID        INTEGER REFERENCES UnitType(UnitTypeID),
  ParentUnit    INTEGER,                 -- self-reference to UnitID
  NationalityID INTEGER,
  StateID       INTEGER REFERENCES State(StateID),
  DistrictID    INTEGER REFERENCES District(DistrictID),
  Active        INTEGER DEFAULT 1
);

CREATE TABLE Rank (
  RankID    INTEGER PRIMARY KEY,
  RankName  TEXT NOT NULL,
  Hierarchy INTEGER,                     -- lower = higher rank
  Active    INTEGER DEFAULT 1
);

CREATE TABLE Designation (
  DesignationID   INTEGER PRIMARY KEY,
  DesignationName TEXT NOT NULL,
  SortOrder       INTEGER,
  Active          INTEGER DEFAULT 1
);

CREATE TABLE Employee (
  EmployeeID          INTEGER PRIMARY KEY,
  DistrictID          INTEGER REFERENCES District(DistrictID),
  UnitID              INTEGER REFERENCES Unit(UnitID),
  RankID              INTEGER REFERENCES Rank(RankID),
  DesignationID       INTEGER REFERENCES Designation(DesignationID),
  KGID                TEXT,
  FirstName           TEXT,
  EmployeeDOB         TEXT,
  GenderID            INTEGER,
  BloodGroupID        INTEGER,
  PhysicallyChallenged INTEGER DEFAULT 0,
  AppointmentDate     TEXT
);

CREATE TABLE Court (
  CourtID    INTEGER PRIMARY KEY,
  CourtName  TEXT NOT NULL,
  DistrictID INTEGER REFERENCES District(DistrictID),
  StateID    INTEGER REFERENCES State(StateID),
  Active     INTEGER DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- 3. Legal
-- ---------------------------------------------------------------------------
CREATE TABLE CrimeHead (
  CrimeHeadID   INTEGER PRIMARY KEY,
  CrimeGroupName TEXT NOT NULL,          -- e.g. Crimes Against Body
  Active        INTEGER DEFAULT 1
);

CREATE TABLE CrimeSubHead (
  CrimeSubHeadID INTEGER PRIMARY KEY,
  CrimeHeadID    INTEGER REFERENCES CrimeHead(CrimeHeadID),
  CrimeHeadName  TEXT NOT NULL,          -- e.g. Murder, Robbery
  SeqID          INTEGER
);

CREATE TABLE Act (
  ActCode        TEXT PRIMARY KEY,       -- IPC, BNS, NDPS ...
  ActDescription TEXT,
  ShortName      TEXT,
  Active         INTEGER DEFAULT 1
);

CREATE TABLE Section (
  SectionID          INTEGER PRIMARY KEY,
  ActCode            TEXT REFERENCES Act(ActCode),
  SectionCode        TEXT,               -- 302, 379 ...
  SectionDescription TEXT,
  Active             INTEGER DEFAULT 1
);

CREATE TABLE CrimeHeadActSection (
  CrimeHeadID INTEGER REFERENCES CrimeHead(CrimeHeadID),
  ActCode     TEXT REFERENCES Act(ActCode),
  SectionCode TEXT
);

-- ---------------------------------------------------------------------------
-- 4. Case core
-- ---------------------------------------------------------------------------
CREATE TABLE CaseMaster (
  CaseMasterID       INTEGER PRIMARY KEY,
  CrimeNo            TEXT NOT NULL,       -- structured 18-digit number
  CaseNo             TEXT,               -- YYYY + 5-digit serial
  CrimeRegisteredDate TEXT,
  PolicePersonID     INTEGER REFERENCES Employee(EmployeeID),
  PoliceStationID    INTEGER REFERENCES Unit(UnitID),
  CaseCategoryID     INTEGER REFERENCES CaseCategory(CaseCategoryID),
  GravityOffenceID   INTEGER REFERENCES GravityOffence(GravityOffenceID),
  CrimeMajorHeadID   INTEGER REFERENCES CrimeHead(CrimeHeadID),
  CrimeMinorHeadID   INTEGER REFERENCES CrimeSubHead(CrimeSubHeadID),
  CaseStatusID       INTEGER REFERENCES CaseStatusMaster(CaseStatusID),
  CourtID            INTEGER REFERENCES Court(CourtID),
  IncidentFromDate   TEXT,
  IncidentToDate     TEXT,
  InfoReceivedPSDate TEXT,
  latitude           REAL,
  longitude          REAL,
  BriefFacts         TEXT
);

CREATE TABLE ComplainantDetails (
  ComplainantID  INTEGER PRIMARY KEY,
  CaseMasterID   INTEGER REFERENCES CaseMaster(CaseMasterID),
  ComplainantName TEXT,
  AgeYear        INTEGER,
  OccupationID   INTEGER REFERENCES OccupationMaster(OccupationID),
  ReligionID     INTEGER REFERENCES ReligionMaster(ReligionID),
  CasteID        INTEGER REFERENCES CasteMaster(caste_master_id),
  GenderID       INTEGER
);

CREATE TABLE Victim (
  VictimMasterID INTEGER PRIMARY KEY,
  CaseMasterID   INTEGER REFERENCES CaseMaster(CaseMasterID),
  VictimName     TEXT,
  AgeYear        INTEGER,
  GenderID       INTEGER,
  VictimPolice   TEXT DEFAULT '0'
);

CREATE TABLE Accused (
  AccusedMasterID INTEGER PRIMARY KEY,
  CaseMasterID    INTEGER REFERENCES CaseMaster(CaseMasterID),
  AccusedName     TEXT,
  AgeYear         INTEGER,
  GenderID        INTEGER,
  PersonID        TEXT                   -- intra-case sort: A1, A2 ... (NOT identity)
);

CREATE TABLE ActSectionAssociation (
  CaseMasterID  INTEGER REFERENCES CaseMaster(CaseMasterID),
  ActID         TEXT REFERENCES Act(ActCode),
  SectionID     TEXT,
  ActOrderID    INTEGER,
  SectionOrderID INTEGER
);

CREATE TABLE ArrestSurrender (
  ArrestSurrenderID    INTEGER PRIMARY KEY,
  CaseMasterID         INTEGER REFERENCES CaseMaster(CaseMasterID),
  ArrestSurrenderTypeID INTEGER,          -- arrest / surrender
  ArrestSurrenderDate  TEXT,
  ArrestSurrenderStateId INTEGER REFERENCES State(StateID),
  ArrestSurrenderDistrictId INTEGER REFERENCES District(DistrictID),
  PoliceStationID      INTEGER REFERENCES Unit(UnitID),
  IOID                 INTEGER REFERENCES Employee(EmployeeID),
  CourtID              INTEGER REFERENCES Court(CourtID),
  AccusedMasterID      INTEGER REFERENCES Accused(AccusedMasterID),
  IsAccused            INTEGER DEFAULT 1,
  IsComplainantAccused INTEGER DEFAULT 0
);

CREATE TABLE ChargesheetDetails (
  CSID           INTEGER PRIMARY KEY,
  CaseMasterID   INTEGER REFERENCES CaseMaster(CaseMasterID),
  csdate         TEXT,
  cstype         TEXT,                   -- A=Chargesheet, B=False Case, C=Undetected
  PolicePersonID INTEGER REFERENCES Employee(EmployeeID)
);

-- ---------------------------------------------------------------------------
-- 5. Entity-resolution output (derived — the moat)
-- ---------------------------------------------------------------------------
CREATE TABLE ResolvedPerson (
  ResolvedPersonID INTEGER PRIMARY KEY,
  CanonicalName    TEXT NOT NULL,
  Gender           INTEGER,
  AgeEstimate      INTEGER,
  CaseCount        INTEGER,
  RiskScore        INTEGER,
  Confidence       REAL                  -- cluster cohesion 0..1
);

CREATE TABLE PersonCaseLink (
  ResolvedPersonID INTEGER REFERENCES ResolvedPerson(ResolvedPersonID),
  AccusedMasterID  INTEGER REFERENCES Accused(AccusedMasterID),
  CaseMasterID     INTEGER REFERENCES CaseMaster(CaseMasterID),
  NameAsRecorded   TEXT,
  MatchConfidence  REAL                  -- link confidence 0..1
);

-- Person-to-person associations (co-accused / shared location)
CREATE TABLE PersonAssociation (
  PersonA    INTEGER REFERENCES ResolvedPerson(ResolvedPersonID),
  PersonB    INTEGER REFERENCES ResolvedPerson(ResolvedPersonID),
  Confidence REAL,
  Kind       TEXT,                       -- co-accused / shared-location
  SharedCases INTEGER
);

-- Ground truth (from the generator) — used only to score resolution, never served
CREATE TABLE GroundTruthIdentity (
  AccusedMasterID INTEGER PRIMARY KEY REFERENCES Accused(AccusedMasterID),
  TruePersonID    INTEGER NOT NULL
);

-- Single-row resolution quality metrics
CREATE TABLE ResolutionMetrics (
  id        INTEGER PRIMARY KEY CHECK (id = 1),
  precision REAL,
  recall    REAL,
  f1        REAL,
  pairs_evaluated INTEGER,
  true_persons INTEGER,
  resolved_persons INTEGER
);

-- ---------------------------------------------------------------------------
-- 6. Precomputed analytics (derived — what the dashboard reads)
-- ---------------------------------------------------------------------------
CREATE TABLE HotspotPoint (
  id        INTEGER PRIMARY KEY,
  latitude  REAL,
  longitude REAL,
  weight    REAL,
  hourBucket INTEGER,                    -- 0..23, for the time slider
  crimeHeadID INTEGER
);

CREATE TABLE KpiSnapshot (
  id       TEXT PRIMARY KEY,            -- total-cases, clearance-rate, ...
  label    TEXT,
  value    TEXT,
  delta    TEXT,
  deltaDirection TEXT,
  deltaSentiment TEXT,
  spark    TEXT                         -- JSON array
);

CREATE TABLE CrimeHeadShare (
  label TEXT PRIMARY KEY,
  pct   REAL,
  count INTEGER,
  seq   INTEGER
);

CREATE TABLE TrendPoint (
  bucket   INTEGER,                      -- 0..N ordinal along the period
  label    TEXT,
  current  INTEGER,
  previous INTEGER
);

CREATE TABLE ZoneStat (
  zone   TEXT PRIMARY KEY,
  cases  INTEGER,
  pct    REAL,
  riskLevel TEXT,
  riskPct   INTEGER
);
