/* ================================
   DOM REFERENCES
================================ */

const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");

const productSearch = document.getElementById("productSearch");

const selectedProductsList = document.getElementById(
  "selectedProductsList"
);

const clearSelectionsBtn = document.getElementById(
  "clearSelections"
);

const generateRoutineBtn = document.getElementById(
  "generateRoutine"
);

const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");

const rtlToggle = document.getElementById("rtlToggle");


/* ================================
   CLOUDFLARE WORKER
================================ */

/*
  Replace this with your real Cloudflare Worker URL.

  Example:
  https://loreal-chatbot.yourname.workers.dev
*/

const endpoint = "YOUR_CLOUDFLARE_WORKER_URL";


/* ================================
   APPLICATION DATA
================================ */

let allProducts = [];

/*
  Load previously selected products
  from localStorage.

  If nothing has been saved yet,
  start with an empty array.
*/

let selectedProducts =
  JSON.parse(localStorage.getItem("selectedProducts")) || [];


/*
  Conversation history.

  This is what allows the chatbot
  to remember previous messages.
*/

const messages = [
  {
    role: "system",
    content: `
You are a friendly L'Oréal Beauty Assistant.

You help users with:
- L'Oréal products
- skincare
- haircare
- makeup
- fragrance
- beauty routines
- beauty recommendations

When the user asks for a routine:
- Only use the products provided to you.
- Explain the order the products should be used.
- Explain when they should be used.
- Give simple and useful instructions.
- Do not invent products that were not selected.

For follow-up questions:
- Remember the routine and previous conversation.
- Stay focused on beauty, skincare, haircare, makeup,
  fragrance, and the generated routine.
- Politely refuse unrelated questions.

Keep answers friendly, helpful, and easy to understand.
`
  }
];


/* ================================
   LOAD PRODUCTS
================================ */

async function loadProducts() {
  try {
    const response = await fetch("products.json");

    if (!response.ok) {
      throw new Error("Could not load products.json");
    }

    const data = await response.json();

    allProducts = data.products;

    /*
      Because our updated HTML says
      "All Categories", display all products
      immediately.
    */

    displayProducts(allProducts);

  } catch (error) {
    console.error("Error loading products:", error);

    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Unable to load products.
      </div>
    `;
  }
}


/* ================================
   DISPLAY PRODUCTS
================================ */

function displayProducts(products) {

  /*
    If nothing matches the filters,
    show a friendly message.
  */

  if (products.length === 0) {

    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found.
      </div>
    `;

    return;
  }


  productsContainer.innerHTML = products
    .map((product) => {

      /*
        Check whether this product is
        currently selected.
      */

      const isSelected = selectedProducts.some(
        (item) => item.name === product.name
      );


      return `
        <div
          class="product-card ${isSelected ? "selected" : ""}"
          data-product-name="${escapeAttribute(product.name)}"
        >

          <img
            src="${product.image}"
            alt="${escapeAttribute(product.name)}"
          >

          <div class="product-info">

            <h3>
              ${product.name}
            </h3>

            <p class="product-brand">
              ${product.brand}
            </p>

            <p class="product-category">
              ${product.category}
            </p>


            <!-- Product Description -->

            <button
              type="button"
              class="description-btn"
              data-description-name="${escapeAttribute(product.name)}"
            >
              View Description
            </button>


            <div
              class="product-description"
              id="description-${createSafeId(product.name)}"
              hidden
            >

              ${product.description || "No description available."}

            </div>

          </div>

        </div>
      `;
    })
    .join("");


  addProductCardListeners();
  addDescriptionListeners();
}


/* ================================
   PRODUCT CARD EVENTS
================================ */

function addProductCardListeners() {

  const productCards =
    document.querySelectorAll(".product-card");


  productCards.forEach((card) => {

    card.addEventListener("click", (event) => {

      /*
        Do not select the product when
        clicking the description button.
      */

      if (
        event.target.classList.contains("description-btn")
      ) {
        return;
      }


      const productName =
        card.dataset.productName;


      const product = allProducts.find(
        (item) => item.name === productName
      );


      if (product) {
        toggleProduct(product);
      }

    });

  });

}


/* ================================
   SELECT / UNSELECT PRODUCT
================================ */

function toggleProduct(product) {

  const alreadySelected =
    selectedProducts.some(
      (item) => item.name === product.name
    );


  if (alreadySelected) {

    selectedProducts =
      selectedProducts.filter(
        (item) => item.name !== product.name
      );

  } else {

    selectedProducts.push(product);

  }


  saveSelectedProducts();

  updateSelectedProducts();

  filterProducts();
}


/* ================================
   SAVE TO LOCALSTORAGE
================================ */

function saveSelectedProducts() {

  localStorage.setItem(
    "selectedProducts",
    JSON.stringify(selectedProducts)
  );

}


/* ================================
   DISPLAY SELECTED PRODUCTS
================================ */

function updateSelectedProducts() {

  if (selectedProducts.length === 0) {

    selectedProductsList.innerHTML = `
      <p class="empty-selection">
        No products selected yet.
      </p>
    `;

    return;
  }


  selectedProductsList.innerHTML =
    selectedProducts
      .map(
        (product) => `

        <div class="selected-product-item">

          <div>

            <strong>
              ${product.name}
            </strong>

            <span>
              ${product.brand}
            </span>

          </div>


          <button
            type="button"
            class="remove-product-btn"
            data-remove-product="${escapeAttribute(product.name)}"
            aria-label="Remove ${escapeAttribute(product.name)}"
          >

            <i class="fa-solid fa-xmark"></i>

          </button>

        </div>

      `
      )
      .join("");


  /*
    Add event listeners to the remove buttons.
  */

  const removeButtons =
    document.querySelectorAll(".remove-product-btn");


  removeButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const productName =
        button.dataset.removeProduct;

      removeProduct(productName);

    });

  });

}


/* ================================
   REMOVE ONE PRODUCT
================================ */

function removeProduct(productName) {

  selectedProducts =
    selectedProducts.filter(
      (product) => product.name !== productName
    );


  saveSelectedProducts();

  updateSelectedProducts();

  filterProducts();
}


/* ================================
   CLEAR ALL PRODUCTS
================================ */

clearSelectionsBtn.addEventListener(
  "click",
  () => {

    selectedProducts = [];

    saveSelectedProducts();

    updateSelectedProducts();

    filterProducts();

  }
);


/* ================================
   PRODUCT DESCRIPTION
================================ */

function addDescriptionListeners() {

  const descriptionButtons =
    document.querySelectorAll(".description-btn");


  descriptionButtons.forEach((button) => {

    button.addEventListener(
      "click",
      (event) => {

        /*
          Stop the click from triggering
          the product-card selection.
        */

        event.stopPropagation();


        const productName =
          button.dataset.descriptionName;


        const description =
          document.getElementById(
            `description-${createSafeId(productName)}`
          );


        if (!description) {
          return;
        }


        const isHidden =
          description.hasAttribute("hidden");


        if (isHidden) {

          description.removeAttribute("hidden");

          button.textContent =
            "Hide Description";

        } else {

          description.setAttribute(
            "hidden",
            ""
          );

          button.textContent =
            "View Description";

        }

      }
    );

  });

}


/* ================================
   CATEGORY + SEARCH FILTER
================================ */

function filterProducts() {

  const category =
    categoryFilter.value.toLowerCase();


  const searchText =
    productSearch.value
      .trim()
      .toLowerCase();


  const filteredProducts =
    allProducts.filter((product) => {

      /*
        Category must match unless
        "All Categories" is selected.
      */

      const matchesCategory =
        category === "" ||
        product.category.toLowerCase() === category;


      /*
        Search across multiple product fields.
      */

      const searchableText = `
        ${product.name || ""}
        ${product.brand || ""}
        ${product.category || ""}
        ${product.description || ""}
      `.toLowerCase();


      const matchesSearch =
        searchableText.includes(searchText);


      return (
        matchesCategory &&
        matchesSearch
      );

    });


  displayProducts(filteredProducts);
}


/* Category filter */

categoryFilter.addEventListener(
  "change",
  filterProducts
);


/* Search LevelUp */

productSearch.addEventListener(
  "input",
  filterProducts
);


/* ================================
   CHAT MESSAGE DISPLAY
================================ */

function addMessage(text, type) {

  const messageDiv =
    document.createElement("div");


  messageDiv.classList.add(
    "message",
    type === "user"
      ? "user-message"
      : "assistant-message"
  );


  /*
    Using textContent instead of innerHTML
    prevents HTML injection.
  */

  messageDiv.textContent = text;


  chatWindow.appendChild(messageDiv);


  /*
    Automatically scroll down
    to the newest message.
  */

  chatWindow.scrollTop =
    chatWindow.scrollHeight;
}


/* ================================
   SEND MESSAGE TO WORKER
================================ */

async function sendToAI() {

  try {

    const response = await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          messages: messages
        })
      }
    );


    if (!response.ok) {

      throw new Error(
        `Server returned ${response.status}`
      );

    }


    const data =
      await response.json();


    /*
      This assumes your Worker returns:

      {
        reply: "AI response here"
      }

      Later, if your Worker uses a different
      format, we can change this one line.
    */

    const reply =
      data.reply ||
      data.message ||
      data.response;


    if (!reply) {

      throw new Error(
        "No AI response was returned."
      );

    }


    return reply;

  } catch (error) {

    console.error(
      "AI request error:",
      error
    );


    throw error;

  }

}


/* ================================
   GENERATE ROUTINE
================================ */

generateRoutineBtn.addEventListener(
  "click",
  async () => {

    /*
      User must select something first.
    */

    if (selectedProducts.length === 0) {

      addMessage(
        "Please select at least one product before generating a routine.",
        "assistant"
      );

      return;
    }


    /*
      Only send the information the
      assignment asks for.
    */

    const productsForAI =
      selectedProducts.map(
        (product) => ({
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description
        })
      );


    const routinePrompt = `
Create a personalized beauty routine using ONLY the following selected products.

Selected products:

${JSON.stringify(productsForAI, null, 2)}

Explain:
1. What order the products should be used in.
2. When each product should be used.
3. How each product fits into the routine.
4. Any useful precautions or tips.

Do not recommend additional products unless the user asks for suggestions later.
`;


    /*
      Add routine request to conversation history.
    */

    messages.push({
      role: "user",
      content: routinePrompt
    });


    addMessage(
      "Creating your personalized routine...",
      "assistant"
    );


    generateRoutineBtn.disabled = true;


    try {

      const reply =
        await sendToAI();


      /*
        Remove the temporary loading message.
      */

      const lastMessage =
        chatWindow.lastElementChild;


      if (
        lastMessage &&
        lastMessage.textContent ===
          "Creating your personalized routine..."
      ) {
        lastMessage.remove();
      }


      /*
        Save AI reply to conversation memory.
      */

      messages.push({
        role: "assistant",
        content: reply
      });


      addMessage(
        reply,
        "assistant"
      );

    } catch (error) {

      const lastMessage =
        chatWindow.lastElementChild;


      if (
        lastMessage &&
        lastMessage.textContent ===
          "Creating your personalized routine..."
      ) {
        lastMessage.remove();
      }


      addMessage(
        "Sorry, I couldn't generate your routine. Check your Cloudflare Worker connection and try again.",
        "assistant"
      );

    } finally {

      generateRoutineBtn.disabled = false;

    }

  }
);


/* ================================
   FOLLOW-UP CHAT
================================ */

chatForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const question =
      userInput.value.trim();


    if (!question) {
      return;
    }


    /*
      Add user's message to screen.
    */

    addMessage(
      question,
      "user"
    );


    /*
      Add it to conversation history.
    */

    messages.push({
      role: "user",
      content: question
    });


    /*
      Clear the textbox.
    */

    userInput.value = "";


    const sendButton =
      document.getElementById("sendBtn");


    sendButton.disabled = true;


    try {

      const reply =
        await sendToAI();


      /*
        Store assistant response so
        future questions remember it.
      */

      messages.push({
        role: "assistant",
        content: reply
      });


      addMessage(
        reply,
        "assistant"
      );

    } catch (error) {

      addMessage(
        "Sorry, I couldn't get a response from the beauty assistant. Please try again.",
        "assistant"
      );

    } finally {

      sendButton.disabled = false;

    }

  }
);


/* ================================
   RTL LEVELUP
================================ */

rtlToggle.addEventListener(
  "click",
  () => {

    const currentDirection =
      document.documentElement.getAttribute("dir");


    if (currentDirection === "rtl") {

      document.documentElement.setAttribute(
        "dir",
        "ltr"
      );

      rtlToggle.innerHTML = `
        <i class="fa-solid fa-language"></i>
        Toggle RTL Layout
      `;

    } else {

      document.documentElement.setAttribute(
        "dir",
        "rtl"
      );

      rtlToggle.innerHTML = `
        <i class="fa-solid fa-language"></i>
        Switch to LTR Layout
      `;

    }

  }
);


/* ================================
   HELPER FUNCTIONS
================================ */

/*
  Create IDs safe for HTML elements.
*/

function createSafeId(text) {

  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

}


/*
  Escape quotes used inside
  HTML data attributes.
*/

function escapeAttribute(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

}


/* ================================
   START APPLICATION
================================ */

/*
  Display selections saved from
  the user's previous visit.
*/

updateSelectedProducts();


/*
  Load product database.
*/

loadProducts();