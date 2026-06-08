import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BudgetAssistant from "../../components/dashboard/BudgetAssistant";
import { getApiUrl } from "../../utils/getApiUrl";

const API = getApiUrl();

export default function BudgetAssistantPage() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);

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
    <div className="min-h-[70vh]">
      <BudgetAssistant
        isOpen
        onClose={() => navigate("/user/menu")}
        foods={foods}
        onAddToCart={addToCart}
      />
    </div>
  );
}
