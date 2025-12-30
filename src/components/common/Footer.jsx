const Footer = () => {
  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container mx-auto px-4 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Wagy. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
