import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CartItem,
  MenuItem,
  UserSession,
  Order,
  GuestJoinRequest,
  ClosedBill,
} from "@/types";
import { generateId } from "@/lib/utils";

// ─── Cart Store ───────────────────────────────────────────────────────────────

interface CartStore {
  items: CartItem[];
  umbrellaId: string | null;
  addItem: (item: MenuItem, quantity?: number, notes?: string, promoLabel?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
  setUmbrellaId: (id: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      umbrellaId: null,

      setUmbrellaId: (id) => set({ umbrellaId: id }),

      addItem: (menuItem, quantity = 1, notes = "", promoLabel?: string) => {
        const existing = get().items.find(
          (i) => i.menuItem.id === menuItem.id
        );
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.menuItem.id === menuItem.id
                ? { ...i, quantity: i.quantity + quantity, promoLabel: promoLabel || i.promoLabel }
                : i
            ),
          }));
        } else {
          set((s) => ({
            items: [...s.items, { menuItem, quantity, notes, promoLabel }],
          }));
        }
      },

      removeItem: (menuItemId) =>
        set((s) => ({
          items: s.items.filter((i) => i.menuItem.id !== menuItemId),
        })),

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.menuItem.id === menuItemId ? { ...i, quantity } : i
          ),
        }));
      },

      updateNotes: (menuItemId, notes) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.menuItem.id === menuItemId ? { ...i, notes } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce(
          (sum, i) => sum + i.menuItem.price * i.quantity,
          0
        ),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "kuziini-cart",
      partialize: (s) => ({ items: s.items, umbrellaId: s.umbrellaId }),
      skipHydration: true,
    }
  )
);

// ─── Session Store ────────────────────────────────────────────────────────────

interface SessionStore {
  userSession: UserSession | null;
  pendingRequests: GuestJoinRequest[];
  orders: Order[];
  closedBills: ClosedBill[];
  setUserSession: (session: UserSession | null) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  addPendingRequest: (req: GuestJoinRequest) => void;
  updateRequestStatus: (
    reqId: string,
    status: GuestJoinRequest["status"]
  ) => void;
  addClosedBill: (bill: ClosedBill) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      userSession: null,
      pendingRequests: [],
      orders: [],
      closedBills: [],

      setUserSession: (session) => set({ userSession: session }),

      addOrder: (order) =>
        set((s) => ({ orders: [order, ...s.orders] })),

      updateOrderStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
          ),
        })),

      addPendingRequest: (req) =>
        set((s) => ({ pendingRequests: [...s.pendingRequests, req] })),

      updateRequestStatus: (reqId, status) =>
        set((s) => ({
          pendingRequests: s.pendingRequests.map((r) =>
            r.id === reqId ? { ...r, status } : r
          ),
        })),

      addClosedBill: (bill) =>
        set((s) => ({ closedBills: [bill, ...s.closedBills] })),

      clearSession: () =>
        set((s) => ({ userSession: null, pendingRequests: [], orders: [], closedBills: s.closedBills })),
    }),
    {
      name: "kuziini-session",
      skipHydration: true,
    }
  )
);

