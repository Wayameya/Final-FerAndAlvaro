const express = require('express');
const axios = require('axios');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'))); // Ruta para archivos estáticos

// Función para obtener recetas de una categoría específica
async function fetchCategoryRecipes(category) {
  try {
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
    return response.data.meals || [];
  } catch (error) {
    console.error(`Error fetching recipes for category ${category}:`, error);
    return [];
  }
}

// Función para obtener recetas aleatorias
async function fetchRandomRecipes(count) {
  const recipes = [];
  for (let i = 0; i < count; i++) {
    try {
      const response = await axios.get('https://www.themealdb.com/api/json/v1/1/random.php');
      if (response.data.meals) {
        recipes.push(response.data.meals[0]);
      }
    } catch (error) {
      console.error('Error fetching random recipe:', error);
    }
  }
  return recipes;
}

// Ruta para mostrar 200 recetas en "/recipies"
app.get('/recipies', async (req, res) => {
  try {
    const categories = ['Seafood', 'Dessert', 'Beef', 'Chicken', 'Vegetarian']; // Puedes añadir más categorías si deseas
    let recipes = [];

    // Llama a varias categorías para obtener recetas
    for (const category of categories) {
      const categoryRecipes = await fetchCategoryRecipes(category);
      recipes = recipes.concat(categoryRecipes);
    }

    // Agrega recetas aleatorias si no hemos alcanzado 200
    if (recipes.length < 200) {
      const randomRecipes = await fetchRandomRecipes(200 - recipes.length);
      recipes = recipes.concat(randomRecipes);
    }

    // Limita a 200 recetas en caso de tener más
    recipes = recipes.slice(0, 200);

    res.render('recipies', { recipes }); // Envía las recetas a recipies.ejs
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Error fetching recipes');
  }
});

// Ruta para mostrar detalles de una receta específica
app.get('/recipies/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
    const recipe = response.data.meals[0];

    res.render('recipeDetail', { recipe }); // Renderiza una vista con los detalles de la receta
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    res.status(500).send('Error fetching recipe details');
  }
});

// Otras rutas
app.get('/', (req, res) => {
  res.render('index'); // Carga index.ejs
});

app.get('/about', (req, res) => {
  res.render('about'); // Carga about.ejs
});

app.get('/contact', (req, res) => {
  res.render('contact'); // Carga contact.ejs
});

app.listen(3000, () => {
  console.log("Application listening on port 3000");
});
