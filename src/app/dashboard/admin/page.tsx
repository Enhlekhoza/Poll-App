import { AdminRoute } from '@/components/AdminRoute';
import { getAllUsers } from '@/lib/actions/poll-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminPage() {
  const { users, error } = await getAllUsers();

  if (error) {
    return (
      <AdminRoute>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p>Welcome to the admin dashboard!</p>

        <h2 className="text-xl font-bold mt-8">Users</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminRoute>
  );
}
