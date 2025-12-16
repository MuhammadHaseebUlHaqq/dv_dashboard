import { promises as fs } from 'fs'
import path from 'path'

export type DataRecord = {
  // Non-numeric identifiers
  country: string
  year: number | null
  clusterLabel: string
  
  // ALL 53 numeric indicators from CSV (matching cluster_countries.py)
  totalPop: number | null
  popDensSqKm: number | null
  urbanPopPerc: number | null
  ruralPopPerc: number | null
  electAccessPop: number | null
  renEnergyConsPerc: number | null
  cleanFuelTechCookPop: number | null
  co2EmissExclLulucf: number | null
  giniCoefficient: number | null
  perceptionsOfCriminality: number | null
  homicideRate: number | null
  policeRate: number | null
  incarcerationRate: number | null
  accessToSmallArms: number | null
  intensityOfInternalConflict: number | null
  violentDemonstrations: number | null
  violentCrime: number | null
  politicalInstability: number | null
  politicalTerrorScale: number | null
  weaponsImports: number | null
  terrorismImpact: number | null
  deathsFromInternalConflict: number | null
  internalConflictsFought: number | null
  militaryExpenditurePercGdp: number | null
  armedServicesPersonnelRate: number | null
  unPeacekeepingFunding: number | null
  nuclearHeavyWeapons: number | null
  weaponsExports: number | null
  refugeesAndIdps: number | null
  neighbouringCountriesRelations: number | null
  externalConflictsFought: number | null
  deathsFromExternalConflict: number | null
  overallScore: number | null
  internalPeace: number | null
  externalPeace: number | null
  safetyAndSecurity: number | null
  ongoingConflict: number | null
  militarisation: number | null
  agValueAdded: number | null
  adjSavingsNaturalResourcesDepletion: number | null
  adjSavingsNetForestDepletion: number | null
  accessToElectricity: number | null
  adjSavingsEnergyDepletion: number | null
  carbonDamage: number | null
  cleanCookingAccess: number | null
  agValueAddedGrowth: number | null
  gdp: number | null
}

const CANDIDATE_PATHS = [
  path.join(process.cwd(), 'public', 'data', 'data.csv'),
  path.join(
    process.cwd(),
    'public',
    'Data',
    'combined_urbanization_life_quality_2008_2020.csv'
  ),
  path.join(
    process.cwd(),
    'public',
    'combined_urbanization_life_quality_2008_2020.csv'
  ),
]

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  
  return result
}

function toNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value === 'null' || value === 'NULL' || value === 'NaN') {
    return null
  }
  const num = Number(value.trim())
  return Number.isFinite(num) && !isNaN(num) ? num : null
}

function getValue(row: Record<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') {
      return row[key]
    }
  }
  return undefined
}

function normalizeRecord(row: Record<string, string>): DataRecord {
  const clusterRaw =
    row['Cluster_Label'] ||
    row['cluster_label'] ||
    row['Cluster'] ||
    row['cluster'] ||
    ''

  let clusterLabel = clusterRaw
  if (!clusterLabel) {
    clusterLabel = 'Unlabeled'
  } else if (!Number.isNaN(Number(clusterLabel))) {
    clusterLabel = `Cluster ${clusterLabel}`
  }

  return {
    // Non-numeric identifiers
    country: getValue(row, 'Country', 'country') || '',
    year: toNumber(getValue(row, 'Year', 'year')),
    clusterLabel,
    
    // ALL 53 numeric indicators from CSV
    totalPop: toNumber(getValue(row, 'total_pop')),
    popDensSqKm: toNumber(getValue(row, 'pop_dens_sq_km')),
    urbanPopPerc: toNumber(getValue(row, 'urban_pop_perc')),
    ruralPopPerc: toNumber(getValue(row, 'rural_pop_perc')),
    electAccessPop: toNumber(getValue(row, 'elect_access_pop')),
    renEnergyConsPerc: toNumber(getValue(row, 'ren_energy_cons_perc')),
    cleanFuelTechCookPop: toNumber(getValue(row, 'clean_fuel_tech_cook_pop')),
    co2EmissExclLulucf: toNumber(getValue(row, 'co2_emiss_excl_lulucf')),
    giniCoefficient: toNumber(getValue(row, 'Gini coefficient (2021 prices)')),
    perceptionsOfCriminality: toNumber(getValue(row, 'perceptions of criminality')),
    homicideRate: toNumber(getValue(row, 'homicide rate')),
    policeRate: toNumber(getValue(row, 'police rate')),
    incarcerationRate: toNumber(getValue(row, 'incarceration rate')),
    accessToSmallArms: toNumber(getValue(row, 'Access to small arms')),
    intensityOfInternalConflict: toNumber(getValue(row, 'intensity of internal conflict')),
    violentDemonstrations: toNumber(getValue(row, 'violent demonstrations')),
    violentCrime: toNumber(getValue(row, 'Violent crime')),
    politicalInstability: toNumber(getValue(row, 'Political instability')),
    politicalTerrorScale: toNumber(getValue(row, 'Political Terror Scale')),
    weaponsImports: toNumber(getValue(row, 'weapons imports')),
    terrorismImpact: toNumber(getValue(row, 'terrorism impact')),
    deathsFromInternalConflict: toNumber(getValue(row, 'deaths from internal conflict')),
    internalConflictsFought: toNumber(getValue(row, 'internal conflicts fought')),
    militaryExpenditurePercGdp: toNumber(getValue(row, 'military expenditure (% gdp)')),
    armedServicesPersonnelRate: toNumber(getValue(row, 'armed services personnel rate')),
    unPeacekeepingFunding: toNumber(getValue(row, 'un peacekeeping funding')),
    nuclearHeavyWeapons: toNumber(getValue(row, 'nuclear and heavy weapons')),
    weaponsExports: toNumber(getValue(row, 'weapons exports')),
    refugeesAndIdps: toNumber(getValue(row, 'refugees and idps')),
    neighbouringCountriesRelations: toNumber(getValue(row, 'Neighbouring countries relations')),
    externalConflictsFought: toNumber(getValue(row, 'external conflicts fought')),
    deathsFromExternalConflict: toNumber(getValue(row, 'deaths From external conflict')),
    overallScore: toNumber(getValue(row, 'overall score')),
    internalPeace: toNumber(getValue(row, 'internal peace')),
    externalPeace: toNumber(getValue(row, 'external peace')),
    safetyAndSecurity: toNumber(getValue(row, 'safety and security')),
    ongoingConflict: toNumber(getValue(row, 'ongoing conflict')),
    militarisation: toNumber(getValue(row, 'militarisation')),
    agValueAdded: toNumber(getValue(row, 'Agriculture, forestry, and fishing, value added (% of GDP)')),
    adjSavingsNaturalResourcesDepletion: toNumber(getValue(row, 'Adjusted savings: natural resources depletion (% of GNI)')),
    adjSavingsNetForestDepletion: toNumber(getValue(row, 'Adjusted savings: net forest depletion (% of GNI)')),
    accessToElectricity: toNumber(getValue(row, 'Access to electricity (% of population)')),
    adjSavingsEnergyDepletion: toNumber(getValue(row, 'Adjusted savings: energy depletion (% of GNI)')),
    carbonDamage: toNumber(getValue(row, 'Adjusted savings: carbon dioxide damage (% of GNI)')),
    cleanCookingAccess: toNumber(getValue(row, 'Access to clean fuels and technologies for cooking (% of population)')),
    agValueAddedGrowth: toNumber(getValue(row, 'Agriculture, forestry, and fishing, value added (annual % growth)')),
    gdp: toNumber(getValue(row, 'gdp')),
  }
}

export async function loadData(csvPath?: string): Promise<DataRecord[]> {
  const finalPath = csvPath || (await resolveCsvPath())
  let raw = await fs.readFile(finalPath, 'utf-8')
  
  // Remove BOM if present
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1)
  }
  
  const lines = raw.trim().split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }
  
  const headerLine = lines[0]
  const headers = splitCsvLine(headerLine)
  
  // Log headers for debugging
  console.log('CSV Headers:', headers.slice(0, 10), '...')

  const records: DataRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    if (!row.trim()) continue
    
    const values = splitCsvLine(row)
    // Pad values array if needed
    while (values.length < headers.length) {
      values.push('')
    }
    
    const record = headers.reduce<Record<string, string>>((acc, key, idx) => {
      acc[key] = values[idx] ?? ''
      return acc
    }, {})
    
    const normalized = normalizeRecord(record)
    
    // Filter out invalid records (summary rows, empty countries, etc.)
    if (normalized.country && 
        normalized.country.trim() !== '' && 
        normalized.year != null &&
        !normalized.country.toLowerCase().includes('ultra-urban') &&
        !normalized.country.toLowerCase().includes('average') &&
        !normalized.country.toLowerCase().includes('summary') &&
        !normalized.country.toLowerCase().includes('total') &&
        !normalized.country.toLowerCase().includes('analysis') &&
        normalized.country.length < 50) {
      records.push(normalized)
    }
  }

  console.log(`Loaded ${records.length} valid records`)
  console.log('Sample record:', {
    country: records[0]?.country,
    gini: records[0]?.giniCoefficient,
    urban: records[0]?.urbanPopPerc,
    perceptions: records[0]?.perceptionsOfCriminality,
  })

  return records
}

async function resolveCsvPath() {
  for (const candidate of CANDIDATE_PATHS) {
    try {
      const stat = await fs.stat(candidate)
      if (stat.isFile()) {
        return candidate
      }
    } catch (error) {
      continue
    }
  }

  throw new Error(
    'CSV file not found. Place it at /public/data/data.csv or /public/Data/combined_urbanization_life_quality_2008_2020.csv'
  )
}

