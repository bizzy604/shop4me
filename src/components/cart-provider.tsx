"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";

const STORAGE_KEY = "shop4me-cart-v1";
export const DEFAULT_SERVICE_FEE = 200;

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string | null;
  imageUrl?: string | null;
};

type CartState = {
  items: CartItem[];
  serviceFee: number;
};

type CartAction =
  | { type: "HYDRATE"; payload: CartState }
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "CLEAR" }
  | { type: "SET_SERVICE_FEE"; payload: number };

const INITIAL_STATE: CartState = {
  items: [],
  serviceFee: DEFAULT_SERVICE_FEE,
};

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE": {
      return {
        items: action.payload.items ?? [],
        serviceFee:
          typeof action.payload.serviceFee === "number"
            ? action.payload.serviceFee
            : DEFAULT_SERVICE_FEE,
      };
    }
    case "ADD_ITEM": {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item,
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }
    case "UPDATE_QUANTITY": {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== id),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity } : item,
        ),
      };
    }
    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    }
    case "CLEAR": {
      return {
        ...state,
        items: [],
      };
    }
    case "SET_SERVICE_FEE": {
      return {
        ...state,
        serviceFee: Math.max(0, action.payload),
      };
    }
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  setServiceFee: (serviceFee: number) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const hasHydrated = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hasHydrated.current) {
      return;
    }
    hasHydrated.current = true;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<CartState> | null;
        if (parsed) {
          dispatch({
            type: "HYDRATE",
            payload: {
              items: Array.isArray(parsed.items) ? parsed.items : [],
              serviceFee:
                typeof parsed.serviceFee === "number"
                  ? parsed.serviceFee
                  : DEFAULT_SERVICE_FEE,
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to hydrate cart from storage", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to persist cart to storage", error);
    }
  }, [state, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          ...item,
          quantity,
        },
      });
    },
    [],
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const setServiceFee = useCallback((serviceFee: number) => {
    dispatch({ type: "SET_SERVICE_FEE", payload: serviceFee });
  }, []);

  const subtotal = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items],
  );

  const itemCount = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items],
  );

  const total = useMemo(() => subtotal + state.serviceFee, [subtotal, state.serviceFee]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      serviceFee: state.serviceFee,
      hydrated,
      subtotal,
      itemCount,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      setServiceFee,
    }),
    [state.items, state.serviceFee, hydrated, subtotal, itemCount, total, addItem, updateQuantity, removeItem, clear, setServiceFee],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function useCartItem(productId: string) {
  const { items } = useCart();
  return items.find((item) => item.productId === productId);
}
