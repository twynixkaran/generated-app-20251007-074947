import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth-store';
import { api } from '@/lib/api-client';
import type { Expense, User } from '@shared/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
export function ExpensesListPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const userParams = new URLSearchParams({ userId: currentUser.id, role: currentUser.role });
      const [expenseData, userData] = await Promise.all([
        api<Expense[]>(`/api/expenses?${userParams.toString()}`),
        api<User[]>('/api/users'),
      ]);
      setExpenses(expenseData);
      setUsers(new Map(userData.map(u => [u.id, u])));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    if (location.state?.refresh) {
      fetchData();
      // Clean up state to prevent re-fetching on other navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, fetchData, navigate, location.pathname]);
  const getStatusBadgeVariant = (status: Expense['status']) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button asChild>
          <Link to="/expenses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Expense
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {currentUser?.role !== 'employee' && <TableHead>Employee</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {currentUser?.role !== 'employee' && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {currentUser?.role !== 'employee' && <TableCell>{users.get(expense.userId)?.name || 'Unknown User'}</TableCell>}
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.merchant}</TableCell>
                    <TableCell>${expense.amount.toFixed(2)} {expense.currency}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(expense.status)} className={cn(
                        expense.status === 'approved' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                        'capitalize'
                      )}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.category}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={currentUser?.role !== 'employee' ? 6 : 5} className="text-center">
                    No expenses found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}