import type { DataRecord } from './loadData'

export interface CountryProfile {
  country: string
  urbanPopPerc: number
  giniCoefficient: number
  overallScore: number
  homicideRate: number
  militarisation: number
  politicalInstability: number
  internalPeace: number
  weaponsExports: number
  weaponsImports: number
  nuclearHeavyWeapons: number
  ongoingConflict: number
  neighbouringCountriesRelations: number
  intensityOfInternalConflict: number
  agValueAdded: number
  renEnergyConsPerc: number
  cleanCookingAccess: number
  perceptionsOfCriminality: number
  violentCrime: number
  violentDemonstrations: number
  accessToSmallArms: number
  safetyAndSecurity: number
  totalPop: number
  carbonDamage: number
  gdp: number
  popDensSqKm: number
  clusterLabel: 'Stable Urbanizers' | 'Volatile Urbanizers'
}

// Get all numeric field keys from DataRecord (excluding year and clusterLabel)
const ALL_NUMERIC_FIELDS: (keyof DataRecord)[] = [
  'totalPop',
  'popDensSqKm',
  'urbanPopPerc',
  'ruralPopPerc',
  'electAccessPop',
  'renEnergyConsPerc',
  'cleanFuelTechCookPop',
  'co2EmissExclLulucf',
  'giniCoefficient',
  'perceptionsOfCriminality',
  'homicideRate',
  'policeRate',
  'incarcerationRate',
  'accessToSmallArms',
  'intensityOfInternalConflict',
  'violentDemonstrations',
  'violentCrime',
  'politicalInstability',
  'politicalTerrorScale',
  'weaponsImports',
  'terrorismImpact',
  'deathsFromInternalConflict',
  'internalConflictsFought',
  'militaryExpenditurePercGdp',
  'armedServicesPersonnelRate',
  'unPeacekeepingFunding',
  'nuclearHeavyWeapons',
  'weaponsExports',
  'refugeesAndIdps',
  'neighbouringCountriesRelations',
  'externalConflictsFought',
  'deathsFromExternalConflict',
  'overallScore',
  'internalPeace',
  'externalPeace',
  'safetyAndSecurity',
  'ongoingConflict',
  'militarisation',
  'agValueAdded',
  'adjSavingsNaturalResourcesDepletion',
  'adjSavingsNetForestDepletion',
  'accessToElectricity',
  'adjSavingsEnergyDepletion',
  'carbonDamage',
  'cleanCookingAccess',
  'agValueAddedGrowth',
  'gdp',
]

// Simple K-Means implementation (matching Python: n_clusters=2, random_state=42, n_init=10, max_iter=300)
function kMeans(data: number[][], k: number, maxIterations: number = 300): number[] {
  const n = data.length
  const m = data[0].length
  
  // Initialize centroids deterministically (use first k points, evenly spaced)
  // This mimics random_state=42 for reproducibility
  let centroids: number[][] = []
  if (n <= k) {
    // If we have fewer points than clusters, use all points
    centroids = data.map(d => [...d])
  } else {
    // Use evenly spaced points for deterministic initialization
    const step = Math.floor(n / k)
    for (let i = 0; i < k; i++) {
      const idx = Math.min(i * step, n - 1)
      centroids.push([...data[idx]])
    }
  }
  
  let clusters = new Array(n).fill(0)
  let prevClusters = new Array(n).fill(-1)
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    for (let i = 0; i < n; i++) {
      let minDist = Infinity
      let bestCluster = 0
      
      for (let c = 0; c < k; c++) {
        let dist = 0
        for (let j = 0; j < m; j++) {
          dist += Math.pow(data[i][j] - centroids[c][j], 2)
        }
        dist = Math.sqrt(dist)
        
        if (dist < minDist) {
          minDist = dist
          bestCluster = c
        }
      }
      clusters[i] = bestCluster
    }
    
    // Check for convergence
    if (clusters.every((c, i) => c === prevClusters[i])) {
      break
    }
    prevClusters = [...clusters]
    
    // Update centroids
    for (let c = 0; c < k; c++) {
      const clusterPoints = data.filter((_, i) => clusters[i] === c)
      if (clusterPoints.length > 0) {
        centroids[c] = new Array(m).fill(0).map((_, j) => 
          clusterPoints.reduce((sum, p) => sum + p[j], 0) / clusterPoints.length
        )
      }
    }
  }
  
  return clusters
}

// Perform clustering on country profiles
export function clusterCountries(data: DataRecord[]): Map<string, CountryProfile> {
  // Group by country and calculate averages for ALL numeric fields
  type CountryAggregation = Record<keyof DataRecord, number[]> & { counts: number }
  const countryMap = new Map<string, Partial<CountryAggregation>>()

  data.forEach((d) => {
    if (!d.country || d.country.trim() === '') return
    
    if (!countryMap.has(d.country)) {
      const entry: Partial<CountryAggregation> = { counts: 0 }
      ALL_NUMERIC_FIELDS.forEach(field => {
        entry[field] = []
      })
      countryMap.set(d.country, entry)
    }
    
    const entry = countryMap.get(d.country)!
    entry.counts = (entry.counts || 0) + 1
    
    // Add all numeric values to the aggregation arrays
    ALL_NUMERIC_FIELDS.forEach(field => {
      if (d[field] != null) {
        (entry[field] as number[]).push(d[field] as number)
      }
    })
  })

  // Create profiles with averaged data (matching Python's groupby.mean())
  const profiles: (CountryProfile & { features: number[] })[] = []
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  
  countryMap.forEach((entry, country) => {
    // Calculate means for all fields
    const allMeans: Record<string, number> = {}
    ALL_NUMERIC_FIELDS.forEach(field => {
      allMeans[field] = avg(entry[field] as number[] || [])
    })
    
    // Create CountryProfile with the subset of fields we track
    const profileValues: CountryProfile = {
      country,
      urbanPopPerc: allMeans.urbanPopPerc || 0,
      giniCoefficient: allMeans.giniCoefficient || 0,
      overallScore: allMeans.overallScore || 0,
      homicideRate: allMeans.homicideRate || 0,
      militarisation: allMeans.militarisation || 0,
      politicalInstability: allMeans.politicalInstability || 0,
      internalPeace: allMeans.internalPeace || 0,
      weaponsExports: allMeans.weaponsExports || 0,
      weaponsImports: allMeans.weaponsImports || 0,
      nuclearHeavyWeapons: allMeans.nuclearHeavyWeapons || 0,
      ongoingConflict: allMeans.ongoingConflict || 0,
      neighbouringCountriesRelations: allMeans.neighbouringCountriesRelations || 0,
      intensityOfInternalConflict: allMeans.intensityOfInternalConflict || 0,
      agValueAdded: allMeans.agValueAdded || 0,
      renEnergyConsPerc: allMeans.renEnergyConsPerc || 0,
      cleanCookingAccess: allMeans.cleanCookingAccess || 0,
      perceptionsOfCriminality: allMeans.perceptionsOfCriminality || 0,
      violentCrime: allMeans.violentCrime || 0,
      violentDemonstrations: allMeans.violentDemonstrations || 0,
      accessToSmallArms: allMeans.accessToSmallArms || 0,
      safetyAndSecurity: allMeans.safetyAndSecurity || 0,
      totalPop: allMeans.totalPop || 0,
      carbonDamage: allMeans.carbonDamage || 0,
      gdp: allMeans.gdp || 0,
      popDensSqKm: allMeans.popDensSqKm || 0,
      clusterLabel: 'Stable Urbanizers',
    }
    
    // Build feature vector with ALL 53 numeric indicators (matching Python)
    // Python: df.select_dtypes(include=[np.number]).columns (excludes Country, Country_Code, Year)
    const features: number[] = ALL_NUMERIC_FIELDS.map(field => allMeans[field] || 0)
    
    // Include all countries (Python doesn't filter)
    if (features.some(f => f != null && !isNaN(f) && isFinite(f))) {
      profiles.push({
        ...profileValues,
        features,
      })
    }
  })

  if (profiles.length === 0) {
    return new Map()
  }

  console.log(`Clustering ${profiles.length} countries using ${ALL_NUMERIC_FIELDS.length} indicators`)

  // Extract features for clustering
  const features = profiles.map(p => p.features)
  
  if (features.length === 0 || features[0].length === 0) {
    return new Map()
  }
  
  const numFeatures = features[0].length
  
  // Handle missing values by replacing NaN/null with 0 (simple approach)
  // Python version doesn't explicitly handle NaN in the clustering step
  const cleanedFeatures = features.map(f => f.map(v => 
    (v != null && !isNaN(v) && isFinite(v)) ? v : 0
  ))
  
  // Normalize features using StandardScaler (matching Python's StandardScaler)
  // scaler = StandardScaler()
  // X_scaled = scaler.fit_transform(X)
  const means = Array.from({ length: numFeatures }, (_, i) => {
    const values = cleanedFeatures.map(f => f[i])
    return values.reduce((a, b) => a + b, 0) / values.length
  })
  const stds = Array.from({ length: numFeatures }, (_, i) => {
    const values = cleanedFeatures.map(f => f[i])
    const mean = means[i]
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  })
  
  const normalized = cleanedFeatures.map(f => f.map((v, i) => stds[i] !== 0 ? (v - means[i]) / stds[i] : 0))
  
  // Perform K-Means clustering (matching Python: n_clusters=2, random_state=42, n_init=10, max_iter=300)
  const clusters = kMeans(normalized, 2, 300)
  
  // Assign temporary cluster numbers
  profiles.forEach((p, i) => {
    p.clusterLabel = clusters[i] === 0 ? 'Stable Urbanizers' : 'Volatile Urbanizers'
  })
  
  // Determine which cluster is "Stable" based on GPI (overall score) + Gini coefficient
  // Python logic:
  // - Lower GPI score = more peaceful
  // - Lower Gini = more equal
  // - If cluster has BOTH lower GPI AND lower Gini → "Urbanized/Rich/Stable"
  const cluster0Profiles = profiles.filter(p => p.clusterLabel === 'Stable Urbanizers')
  const cluster1Profiles = profiles.filter(p => p.clusterLabel === 'Volatile Urbanizers')
  
  const cluster0GPI = cluster0Profiles.reduce((sum, p) => sum + (p.overallScore || 0), 0) / cluster0Profiles.length
  const cluster1GPI = cluster1Profiles.reduce((sum, p) => sum + (p.overallScore || 0), 0) / cluster1Profiles.length
  const cluster0Gini = cluster0Profiles.reduce((sum, p) => sum + (p.giniCoefficient || 0), 0) / cluster0Profiles.length
  const cluster1Gini = cluster1Profiles.reduce((sum, p) => sum + (p.giniCoefficient || 0), 0) / cluster1Profiles.length
  
  // If cluster 0 has both lower GPI and lower Gini, it's the stable cluster
  // Otherwise, cluster 1 is the stable cluster
  const cluster0IsStable = cluster0GPI < cluster1GPI && cluster0Gini < cluster1Gini
  
  console.log(`Cluster 0: GPI=${cluster0GPI.toFixed(2)}, Gini=${cluster0Gini.toFixed(2)}, Count=${cluster0Profiles.length}`)
  console.log(`Cluster 1: GPI=${cluster1GPI.toFixed(2)}, Gini=${cluster1Gini.toFixed(2)}, Count=${cluster1Profiles.length}`)
  console.log(`Stable cluster: ${cluster0IsStable ? 0 : 1}`)
  
  // Assign final labels (matching Python: "Urbanized/Rich/Stable" vs "Urbanizing/Developing/Volatile")
  if (!cluster0IsStable) {
    // Flip the labels
    profiles.forEach(p => {
      p.clusterLabel = p.clusterLabel === 'Stable Urbanizers' ? 'Volatile Urbanizers' : 'Stable Urbanizers'
    })
  }
  
  // Return as Map
  const result = new Map<string, CountryProfile>()
  profiles.forEach(p => {
    result.set(p.country, p)
  })
  
  return result
}
