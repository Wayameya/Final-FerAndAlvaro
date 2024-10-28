require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");
const mongoose = require("mongoose");
const app = express();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");

var user = process.env.DB_USER;
var password = process.env.DB_PASS;
var db = process.env.DB;

const mongoURL = `mongodb+srv://${user}:${password}@conect.vabyx.mongodb.net/${db}?retryWrites=true&w=majority&appName=Conect`;

mongoose.connect(mongoURL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));


//Definir el esquema y modelo para los mensajes de contacto
const contactSchema =
  new mongoose.Schema({
    name : String,
    email : String,
    message: String
  });
contactSchema.set("strictQuery", true);

const Contact = mongoose.model("contacts", contactSchema);

// Función para obtener recetas de una categoría específica
async function fetchCategoryRecipes(category) {
  try {
    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
    );
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
      const response = await axios.get(
        "https://www.themealdb.com/api/json/v1/1/random.php"
      );
      if (response.data.meals) {
        recipes.push(response.data.meals[0]);
      }
    } catch (error) {
      console.error("Error fetching random recipe:", error);
    }
  }
  return recipes;
}

// Ruta para mostrar 200 recetas en "/recipies"
app.get("/recipies", async (req, res) => {
  try {
    const categories = ["Seafood", "Dessert", "Beef", "Chicken", "Vegetarian"];
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

    res.render("recipies", { recipes }); // Envía las recetas a recipies.ejs
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).send("Error fetching recipes");
  }
});

app.get("/recipes/:id", async (req, res) => {
  try {
    const recipeId = req.params.id;
    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`
    );
    const recipe = response.data.meals ? response.data.meals[0] : null;

    if (recipe) {
      res.render("recipeDetail", { recipe });
    } else {
      res.status(404).send("Recipe not found");
    }
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).send("Error fetching recipe details");
  }
});

// Ruta para cargar el formulario de contacto
app.get("/contact", (req, res) => {
  res.render("contact");
});

// Ruta para manejar el envío del formulario de contacto
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newMessage = new Contact({ name, email, message });
    await newMessage.save();

    // Renderiza nuevamente el formulario
    res.render("contact", { message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res.status(500).send("Error saving contact message");
  }
});

app.get("/", (req, res) => {
  res.render("index"); // Carga index.ejs
});

app.get("/about", (req, res) => {
  res.render("about"); // Carga about.ejs
});

app.get("/contact", (req, res) => {
  res.render("contact"); // Carga contact.ejs
});

app.listen(3000, () => {
  console.log("Application listening on port 3000");
});
