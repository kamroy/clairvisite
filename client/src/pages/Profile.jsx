import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Field from "../components/Field";
import Loading from "../components/Loading";
import { initials } from "../lib/format";
import { useMe, useUpdateMyAccount } from "../hooks/useAuth";
import { useTouched } from "../hooks/useTouched";
import { FRENCH_PHONE_PATTERN, FRENCH_PHONE_TITLE, isValidFrenchPhone } from "../lib/validation";

const ROLE_LABELS = { acheteur: "Acheteur", technicien: "Technicien", admin: "Administrateur" };

export default function Profile() {
  const navigate = useNavigate();
  const meQuery = useMe();
  const updateAccount = useUpdateMyAccount();
  const { onBlurField, isTouched } = useTouched();
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (meQuery.data) setPhone(meQuery.data.phone ?? "");
  }, [meQuery.data]);

  useEffect(() => {
    if (meQuery.isError) navigate("/login");
  }, [meQuery.isError, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaved(false);
    try {
      await updateAccount.mutateAsync({ phone });
      setSaved(true);
    } catch {
      // erreur exposée via updateAccount.error ci-dessous
    }
  }

  if (meQuery.isLoading || !meQuery.data) return <Loading />;
  const user = meQuery.data;

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <div className="mb-4 flex flex-col gap-3.5 rounded-card border border-line bg-white p-4.5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-line/40 text-sm font-semibold">
            {initials(user.fullName)}
          </div>
          <div>
            <div className="text-[15px] font-semibold">{user.fullName}</div>
            <div className="text-xs text-muted">{ROLE_LABELS[user.role] ?? user.role}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Email" type="email" value={user.email} disabled />
        <Field
          label="Numéro de téléphone"
          type="tel"
          name="phone"
          placeholder="06 12 34 56 78"
          required
          pattern={FRENCH_PHONE_PATTERN}
          title={FRENCH_PHONE_TITLE}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={onBlurField("phone")}
          invalid={isTouched("phone") && phone !== "" && !isValidFrenchPhone(phone)}
        />

        {updateAccount.isError && <p className="text-sm text-red-600">{updateAccount.error.message}</p>}
        {saved && <p className="text-sm text-sage">Profil mis à jour.</p>}

        <Button type="submit" disabled={updateAccount.isPending}>
          {updateAccount.isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
