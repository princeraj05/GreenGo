import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BudgetAssistant from "../../components/dashboard/BudgetAssistant";
import { getApiUrl } from "../../utils/getApiUrl";

const API = getApiUrl();

/**
 * BudgetAssistantPage Component
 * 
 * Provides a dedicated page for the Budget Assistant helper, loading food products
 * and handling addition of calculated items to the shopping cart.
 */
export default function BudgetAssistantPage() {
  const navigate = useNavigate();

  /* --- STATE DECLARATIONS --- */
  // foods: Stores the list of food items loaded from the backend API for the budget calculator
  const [foods, setFoods] = useState([]);

  /* --- DATA FETCHING & EFFECTS --- */
  // Loads available food items from the backend server on component mount
  useEffect(() => {
    let mounted = true;

    const loadFoods = async () => {
      try {
        const res = await fetch(`${API}/api/foods`);
        if (res.ok && mounted) {
          setFoods(await res.json());
        }
      } catch (err) {
        console.error("Failed to load foods for budget assistant:", err);
      }
    };

    loadFoods();
    return () => {
      mounted = false;
    };
  }, []);

  /* --- EVENT HANDLERS --- */
  /**
   * addToCart: Saves or updates a food item and its chosen quantity in localStorage,
   * then fires a custom 'cart-updated' window event to notify other UI components.
   * 
   * @param {Object} food - The food item object
   * @param {number} newQty - The new quantity desired for this item
   */
  const addToCart = (food, newQty = 1) => {
    const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingIndex = currentCart.findIndex((item) => item._id === food._id);

    if (newQty <= 0) {
      if (existingIndex > -1) currentCart.splice(existingIndex, 1);
    } else if (existingIndex > -1) {
      currentCart[existingIndex].qty = newQty;
    } else {
      currentCart.push({
        _id: food._id,
        name: food.name,
        price: food.price,
        image: food.image,
        qty: newQty,
      });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    /* --- MAIN CONTAINER --- */
    /* Tailwind: min-h-[70vh] guarantees that the budget assistant container fills at least 70% of the viewport height */
    <div className="min-h-[70vh]">
      
      {/* --- BUDGET ASSISTANT INTERFACE --- */}
      <BudgetAssistant
        isOpen
        onClose={() => navigate("/user/menu")}
        foods={foods}
        onAddToCart={addToCart}
      />
      
    </div>
  );
}

