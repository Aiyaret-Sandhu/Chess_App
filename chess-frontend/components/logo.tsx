import Image from 'next/image';

const Logo = () => {
  return (
    <div>
      <Image
        src="/assets/logo.png" // Path to your image
        alt="Logo"
        width={50} // Specify width
        height={50} // Specify height
        priority // Optional: Load the image with priority
      />
    </div>
  );
};

export default Logo;
