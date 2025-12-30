import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Name: {user.name}</p>
            <p>Email: {user.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Pets</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You have no pets registered yet.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No upcoming appointments.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
