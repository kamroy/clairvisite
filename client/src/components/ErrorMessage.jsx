export default function ErrorMessage({ error }) {
  return <p className="p-6 text-center text-sm text-red-600">{error.message}</p>;
}
