import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createLocalExpense,
  deleteLocalExpense,
  listLocalExpenses,
  updateLocalExpense,
} from '@/lib/localDatabase';
import type { Expense, ExpenseInput } from '@/lib/types';

type ExpensesContextValue = {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addExpense: (data: ExpenseInput) => Promise<string | null>;
  updateExpense: (id: string, data: Partial<ExpenseInput>) => Promise<string | null>;
  deleteExpense: (id: string) => Promise<string | null>;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const queryKey = ['ember-local-expenses'];
  const query = useQuery({
    queryKey,
    queryFn: listLocalExpenses,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: createLocalExpense,
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseInput> }) =>
      updateLocalExpense(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteLocalExpense,
    onSuccess: invalidate,
  });

  const add = async (data: ExpenseInput) => {
    try {
      await addMutation.mutateAsync(data);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No se pudo guardar el gasto';
    }
  };
  const update = async (id: string, data: Partial<ExpenseInput>) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No se pudo actualizar el gasto';
    }
  };
  const remove = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No se pudo eliminar la suscripción';
    }
  };

  const value = useMemo(
    () => ({
      expenses: query.data ?? [],
      loading: query.isLoading || query.isFetching,
      error: query.error instanceof Error ? query.error.message : null,
      refresh: async () => {
        await query.refetch();
      },
      addExpense: add,
      updateExpense: update,
      deleteExpense: remove,
    }),
    [query.data, query.error, query.isFetching, query.isLoading],
  );

  return (
    <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (!context) throw new Error('useExpenses must be used inside ExpensesProvider');
  return context;
}