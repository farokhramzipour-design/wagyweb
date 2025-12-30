import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

const Services = () => {
  const services = [
    {
      title: 'Pet Walking',
      description: 'Professional dog walking services tailored to your pet\'s needs.',
      price: '$20/hour'
    },
    {
      title: 'Pet Sitting',
      description: 'In-home pet sitting to keep your pets comfortable while you\'re away.',
      price: '$50/night'
    },
    {
      title: 'Grooming',
      description: 'Full-service grooming to keep your pet looking and feeling their best.',
      price: 'Starts at $40'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Our Services</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{service.title}</CardTitle>
              <CardDescription>{service.price}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{service.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Services;
