// PlantVillage 38-class disease knowledge base
// Maps model output labels → structured treatment info

const DISEASE_DB = {
  // APPLE
  'Apple___Apple_scab': {
    name: 'Apple Scab', plant: 'Apple', severity: 'moderate',
    description: 'Fungal disease causing dark, scabby lesions on leaves and fruit.',
    treatments: [
      { method: 'Neem oil spray', instructions: 'Mix 5ml neem oil + 1ml dish soap in 1L water. Spray every 7 days.', organic: true },
      { method: 'Copper fungicide', instructions: 'Apply copper-based fungicide at bud break and repeat every 10 days.', organic: false }
    ],
    prevention: ['Remove fallen leaves promptly', 'Ensure good air circulation', 'Avoid overhead watering', 'Plant resistant varieties']
  },
  'Apple___Black_rot': {
    name: 'Black Rot', plant: 'Apple', severity: 'severe',
    description: 'Fungal infection causing circular brown spots with purple borders on leaves, rotting fruit.',
    treatments: [
      { method: 'Prune infected branches', instructions: 'Cut 15cm below visible infection. Sterilize tools between cuts.', organic: true },
      { method: 'Captan fungicide', instructions: 'Apply every 7-10 days during wet weather.', organic: false }
    ],
    prevention: ['Remove mummified fruit', 'Prune dead wood annually', 'Avoid wounding bark']
  },
  'Apple___Cedar_apple_rust': {
    name: 'Cedar Apple Rust', plant: 'Apple', severity: 'moderate',
    description: 'Fungal disease causing bright orange-yellow spots on leaves.',
    treatments: [
      { method: 'Myclobutanil fungicide', instructions: 'Apply at pink bud stage, repeat every 7-10 days for 3 applications.', organic: false },
      { method: 'Sulfur spray', instructions: 'Apply wettable sulfur every 7 days when conditions are wet.', organic: true }
    ],
    prevention: ['Remove nearby juniper/cedar trees if possible', 'Plant resistant apple varieties']
  },
  'Apple___healthy': { name: 'Healthy', plant: 'Apple', severity: 'none', description: 'Plant appears healthy with no visible disease.', treatments: [], prevention: ['Maintain regular watering', 'Fertilize seasonally', 'Monitor for early signs of pests'] },

  // BLUEBERRY
  'Blueberry___healthy': { name: 'Healthy', plant: 'Blueberry', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Maintain acidic soil pH 4.5-5.5', 'Mulch to retain moisture'] },

  // CHERRY
  'Cherry_(including_sour)___Powdery_mildew': {
    name: 'Powdery Mildew', plant: 'Cherry', severity: 'moderate',
    description: 'White powdery coating on leaves, shoots, and fruit.',
    treatments: [
      { method: 'Baking soda spray', instructions: 'Mix 1 tsp baking soda + 1 tsp dish soap in 1L water. Spray weekly.', organic: true },
      { method: 'Potassium bicarbonate', instructions: 'Apply 1 tbsp per liter water, spray on affected areas.', organic: true }
    ],
    prevention: ['Improve air circulation by pruning', 'Avoid overhead irrigation', 'Remove infected leaves immediately']
  },
  'Cherry_(including_sour)___healthy': { name: 'Healthy', plant: 'Cherry', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Regular pruning for air flow', 'Balanced fertilization'] },

  // CORN/MAIZE
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
    name: 'Gray Leaf Spot', plant: 'Corn/Maize', severity: 'moderate',
    description: 'Rectangular gray-brown lesions running parallel to leaf veins.',
    treatments: [
      { method: 'Triazole fungicide', instructions: 'Apply at first sign of disease, repeat after 14 days.', organic: false },
      { method: 'Crop rotation', instructions: 'Rotate with non-host crops for at least 1 season.', organic: true }
    ],
    prevention: ['Use resistant hybrids', 'Improve drainage', 'Reduce crop residue']
  },
  'Corn_(maize)___Common_rust_': {
    name: 'Common Rust', plant: 'Corn/Maize', severity: 'moderate',
    description: 'Small, circular to elongated brown pustules on both leaf surfaces.',
    treatments: [
      { method: 'Mancozeb fungicide', instructions: 'Apply at early rust detection, repeat every 10-14 days.', organic: false }
    ],
    prevention: ['Plant early to avoid peak rust season', 'Use resistant varieties', 'Scout fields regularly']
  },
  'Corn_(maize)___Northern_Leaf_Blight': {
    name: 'Northern Leaf Blight', plant: 'Corn/Maize', severity: 'severe',
    description: 'Long, cigar-shaped gray-green lesions on leaves.',
    treatments: [
      { method: 'Propiconazole fungicide', instructions: 'Apply at VT/R1 growth stage for best results.', organic: false }
    ],
    prevention: ['Use resistant hybrids', 'Crop rotation', 'Bury crop residue']
  },
  'Corn_(maize)___healthy': { name: 'Healthy', plant: 'Corn/Maize', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Balanced NPK fertilization', 'Adequate spacing for air flow'] },

  // GRAPE
  'Grape___Black_rot': {
    name: 'Black Rot', plant: 'Grape', severity: 'severe',
    description: 'Brown circular lesions on leaves; fruit shrivels into black mummies.',
    treatments: [
      { method: 'Mancozeb spray', instructions: 'Apply every 7-10 days from bud break through veraison.', organic: false },
      { method: 'Remove mummified fruit', instructions: 'Hand-remove all shriveled berries and destroy them.', organic: true }
    ],
    prevention: ['Prune for open canopy', 'Remove all mummies before spring', 'Avoid wetting foliage']
  },
  'Grape___Esca_(Black_Measles)': {
    name: 'Esca (Black Measles)', plant: 'Grape', severity: 'severe',
    description: 'Tiger-stripe pattern on leaves; internal wood discoloration.',
    treatments: [
      { method: 'Pruning infected wood', instructions: 'Remove and destroy infected canes. Make clean cuts.', organic: true }
    ],
    prevention: ['Protect pruning wounds with wound sealant', 'Avoid large pruning cuts', 'Maintain vine vigor']
  },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
    name: 'Leaf Blight', plant: 'Grape', severity: 'moderate',
    description: 'Dark brown irregular spots with yellow halos on leaves.',
    treatments: [
      { method: 'Copper oxychloride', instructions: 'Spray 3g per liter water every 10 days.', organic: true }
    ],
    prevention: ['Improve canopy ventilation', 'Avoid overhead irrigation', 'Remove infected leaves']
  },
  'Grape___healthy': { name: 'Healthy', plant: 'Grape', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Annual pruning', 'Monitor for pests weekly'] },

  // ORANGE
  'Orange___Haunglongbing_(Citrus_greening)': {
    name: 'Citrus Greening (HLB)', plant: 'Orange', severity: 'severe',
    description: 'Yellowing of shoots, asymmetric blotchy mottling, small lopsided fruit. No cure exists.',
    treatments: [
      { method: 'Remove infected trees', instructions: 'Infected trees should be removed to prevent spread to healthy trees.', organic: true },
      { method: 'Control psyllid vector', instructions: 'Apply systemic insecticide to control Asian citrus psyllid that spreads the disease.', organic: false }
    ],
    prevention: ['Use certified disease-free nursery stock', 'Control psyllid populations', 'Inspect regularly for symptoms']
  },

  // PEACH
  'Peach___Bacterial_spot': {
    name: 'Bacterial Spot', plant: 'Peach', severity: 'moderate',
    description: 'Water-soaked spots on leaves that turn brown; fruit develops pits and cracks.',
    treatments: [
      { method: 'Copper bactericide', instructions: 'Apply copper hydroxide at petal fall and repeat every 10-14 days.', organic: true }
    ],
    prevention: ['Plant resistant varieties', 'Avoid overhead irrigation', 'Prune for good air circulation']
  },
  'Peach___healthy': { name: 'Healthy', plant: 'Peach', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Annual dormant pruning', 'Thin fruit for better size'] },

  // PEPPER
  'Pepper,_bell___Bacterial_spot': {
    name: 'Bacterial Spot', plant: 'Bell Pepper', severity: 'moderate',
    description: 'Small water-soaked spots on leaves and fruit that turn brown with yellow halos.',
    treatments: [
      { method: 'Copper spray', instructions: 'Mix 3g copper oxychloride per liter. Spray every 7 days.', organic: true },
      { method: 'Remove infected leaves', instructions: 'Prune and destroy all visibly infected plant parts.', organic: true }
    ],
    prevention: ['Use disease-free seeds', 'Avoid working with wet plants', 'Rotate crops annually', 'Avoid overhead watering']
  },
  'Pepper,_bell___healthy': { name: 'Healthy', plant: 'Bell Pepper', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Consistent watering', 'Support heavy fruit with stakes'] },

  // POTATO
  'Potato___Early_blight': {
    name: 'Early Blight', plant: 'Potato', severity: 'moderate',
    description: 'Dark brown spots with concentric rings (target-board pattern) on older leaves.',
    treatments: [
      { method: 'Neem oil spray', instructions: 'Apply 5ml neem oil per liter water every 7 days.', organic: true },
      { method: 'Chlorothalonil fungicide', instructions: 'Apply every 7-10 days starting when plants are 15cm tall.', organic: false }
    ],
    prevention: ['Rotate crops every 2-3 years', 'Remove infected leaves', 'Avoid overhead watering', 'Mulch to prevent soil splash']
  },
  'Potato___Late_blight': {
    name: 'Late Blight', plant: 'Potato', severity: 'severe',
    description: 'Water-soaked lesions that turn brown-black rapidly. Can destroy entire crop.',
    treatments: [
      { method: 'Metalaxyl + Mancozeb', instructions: 'Apply immediately at first sign. Repeat every 5-7 days in wet weather.', organic: false },
      { method: 'Remove infected plants', instructions: 'Bag and destroy infected plants immediately to prevent spread.', organic: true }
    ],
    prevention: ['Plant certified disease-free seed potatoes', 'Avoid overhead irrigation', 'Hill soil around plants', 'Monitor weather forecasts']
  },
  'Potato___healthy': { name: 'Healthy', plant: 'Potato', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Hill soil regularly', 'Ensure good drainage'] },

  // RASPBERRY
  'Raspberry___healthy': { name: 'Healthy', plant: 'Raspberry', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Annual cane pruning', 'Trellis for support'] },

  // SOYBEAN
  'Soybean___healthy': { name: 'Healthy', plant: 'Soybean', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Crop rotation', 'Balanced fertilization'] },

  // SQUASH
  'Squash___Powdery_mildew': {
    name: 'Powdery Mildew', plant: 'Squash', severity: 'moderate',
    description: 'White powdery coating on leaves, reducing photosynthesis.',
    treatments: [
      { method: 'Baking soda spray', instructions: '1 tsp baking soda + 1 tsp neem oil + 1L water. Spray weekly.', organic: true },
      { method: 'Milk spray', instructions: 'Mix 1 part milk with 9 parts water. Spray on affected leaves in morning.', organic: true }
    ],
    prevention: ['Space plants for air circulation', 'Water at base only', 'Remove infected leaves early']
  },

  // STRAWBERRY
  'Strawberry___Leaf_scorch': {
    name: 'Leaf Scorch', plant: 'Strawberry', severity: 'moderate',
    description: 'Small purple spots that enlarge and cause leaf edges to look scorched.',
    treatments: [
      { method: 'Remove infected leaves', instructions: 'Remove and destroy all infected foliage.', organic: true },
      { method: 'Captan fungicide', instructions: 'Apply at first sign of disease, repeat every 10 days.', organic: false }
    ],
    prevention: ['Use certified disease-free plants', 'Avoid overhead watering', 'Renovate beds after harvest']
  },
  'Strawberry___healthy': { name: 'Healthy', plant: 'Strawberry', severity: 'none', description: 'Plant appears healthy.', treatments: [], prevention: ['Mulch to prevent soil splash', 'Remove runners regularly'] },

  // TOMATO
  'Tomato___Bacterial_spot': {
    name: 'Bacterial Spot', plant: 'Tomato', severity: 'moderate',
    description: 'Small water-soaked spots on leaves and fruit, turning brown with yellow halos.',
    treatments: [
      { method: 'Copper spray', instructions: 'Mix 3g copper oxychloride per liter. Spray every 7 days.', organic: true },
      { method: 'Remove infected leaves', instructions: 'Prune and destroy all visibly infected plant parts immediately.', organic: true }
    ],
    prevention: ['Use disease-free seeds', 'Avoid overhead watering', 'Rotate crops annually', 'Disinfect tools']
  },
  'Tomato___Early_blight': {
    name: 'Early Blight', plant: 'Tomato', severity: 'moderate',
    description: 'Dark brown spots with concentric rings on lower leaves first.',
    treatments: [
      { method: 'Neem oil spray', instructions: 'Mix 5ml neem oil + 2ml dish soap in 1L water. Spray every 7 days.', organic: true },
      { method: 'Remove lower leaves', instructions: 'Remove all leaves within 30cm of soil to reduce splash infection.', organic: true }
    ],
    prevention: ['Mulch around base', 'Water at soil level', 'Stake plants for air flow', 'Rotate crops']
  },
  'Tomato___Late_blight': {
    name: 'Late Blight', plant: 'Tomato', severity: 'severe',
    description: 'Large irregular water-soaked lesions turning brown-black. White mold on undersides.',
    treatments: [
      { method: 'Remove infected plants', instructions: 'Remove and bag infected plants immediately. Do not compost.', organic: true },
      { method: 'Mancozeb fungicide', instructions: 'Apply every 5-7 days in wet weather as preventive measure.', organic: false }
    ],
    prevention: ['Avoid overhead watering', 'Improve air circulation', 'Monitor weather — disease spreads in cool wet conditions']
  },
  'Tomato___Leaf_Mold': {
    name: 'Leaf Mold', plant: 'Tomato', severity: 'moderate',
    description: 'Yellow patches on upper leaf surface; olive-green mold on underside.',
    treatments: [
      { method: 'Improve ventilation', instructions: 'Prune lower leaves and increase spacing between plants.', organic: true },
      { method: 'Copper fungicide', instructions: 'Apply copper-based spray every 7-10 days.', organic: true }
    ],
    prevention: ['Reduce humidity in greenhouse', 'Avoid wetting foliage', 'Use resistant varieties']
  },
  'Tomato___Septoria_leaf_spot': {
    name: 'Septoria Leaf Spot', plant: 'Tomato', severity: 'moderate',
    description: 'Small circular spots with dark borders and light centers, starting on lower leaves.',
    treatments: [
      { method: 'Remove infected leaves', instructions: 'Remove all spotted leaves and destroy them.', organic: true },
      { method: 'Chlorothalonil spray', instructions: 'Apply every 7-10 days during wet weather.', organic: false }
    ],
    prevention: ['Mulch to prevent soil splash', 'Stake plants', 'Rotate crops every 2 years']
  },
  'Tomato___Spider_mites Two-spotted_spider_mite': {
    name: 'Spider Mites', plant: 'Tomato', severity: 'moderate',
    description: 'Tiny yellow stippling on leaves; fine webbing visible on undersides.',
    treatments: [
      { method: 'Neem oil spray', instructions: 'Spray neem oil solution on leaf undersides every 5 days for 3 weeks.', organic: true },
      { method: 'Water spray', instructions: 'Strong water spray on leaf undersides dislodges mites. Repeat daily.', organic: true }
    ],
    prevention: ['Maintain adequate humidity', 'Avoid water stress', 'Introduce predatory mites']
  },
  'Tomato___Target_Spot': {
    name: 'Target Spot', plant: 'Tomato', severity: 'moderate',
    description: 'Brown circular lesions with concentric rings on leaves and fruit.',
    treatments: [
      { method: 'Azoxystrobin fungicide', instructions: 'Apply at first sign of disease, repeat every 14 days.', organic: false },
      { method: 'Remove infected material', instructions: 'Remove and destroy all infected leaves and fruit.', organic: true }
    ],
    prevention: ['Improve air circulation', 'Avoid overhead irrigation', 'Crop rotation']
  },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    name: 'Yellow Leaf Curl Virus', plant: 'Tomato', severity: 'severe',
    description: 'Leaves curl upward and turn yellow; stunted growth. Spread by whiteflies.',
    treatments: [
      { method: 'Control whiteflies', instructions: 'Apply yellow sticky traps. Spray neem oil to reduce whitefly population.', organic: true },
      { method: 'Remove infected plants', instructions: 'Remove severely infected plants to prevent spread.', organic: true }
    ],
    prevention: ['Use reflective mulch to repel whiteflies', 'Plant resistant varieties', 'Use insect-proof netting']
  },
  'Tomato___Tomato_mosaic_virus': {
    name: 'Tomato Mosaic Virus', plant: 'Tomato', severity: 'severe',
    description: 'Mottled light and dark green pattern on leaves; distorted growth.',
    treatments: [
      { method: 'Remove infected plants', instructions: 'Remove and destroy infected plants. Wash hands after handling.', organic: true }
    ],
    prevention: ['Use virus-free seeds', 'Disinfect tools with bleach solution', 'Control aphids that spread the virus', 'Avoid tobacco near plants']
  },
  'Tomato___healthy': { name: 'Healthy', plant: 'Tomato', severity: 'none', description: 'Plant appears healthy with no visible disease.', treatments: [], prevention: ['Water consistently at base', 'Stake for support', 'Remove suckers for better yield'] },
};

// Normalize HF model label to DB key
function normalizeLabel(label) {
  // HF model may return labels with spaces or slightly different formatting
  return label.replace(/ /g, '_').replace(/\(/g, '(').replace(/\)/g, ')');
}

function getDiseaseInfo(label) {
  const normalized = normalizeLabel(label);
  // Direct match
  if (DISEASE_DB[normalized]) return DISEASE_DB[normalized];
  // Fuzzy match — find closest key
  const keys = Object.keys(DISEASE_DB);
  const match = keys.find(k => k.toLowerCase().includes(normalized.toLowerCase().split('___')[1] || normalized.toLowerCase()));
  return match ? DISEASE_DB[match] : null;
}

module.exports = { DISEASE_DB, getDiseaseInfo };
