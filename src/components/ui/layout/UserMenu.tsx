import { User } from 'lucide-react';
interface UserMenuProps {
  name: string;
  email: string;
  loading?: boolean;
  sizeAvatar?: number;
}

export default function UserMenu({ name, email, loading, sizeAvatar = 44 }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
          <div
      style={{ width: sizeAvatar, height: sizeAvatar }}
      className="flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#D8D5CE] text-[#8A8A86]"
    >
      <User size={sizeAvatar * 0.5} />
    </div>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold text-[#1C1C1A]">
          {loading ? 'Carregando...' : name}
        </div>
        <div className="text-[13px] text-[#8A8A86]">{loading ? '' : email}</div>
      </div>
    </div>
  );
}