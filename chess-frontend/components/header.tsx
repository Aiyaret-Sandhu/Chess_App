import Link from "next/link";
import Logo from "@/components/logo";

const Header = ({ text }: { text: string }) => {
  return (
    <h1 className="z-[100] text-gray-400 flex items-center justify-start px-10 text-lg">
      <Link href="/">
        <Logo />
      </Link>
      <p className="ml-2">{text}</p>
    </h1>
  );
};

export default Header;
