import ManageUsers from "../ManageUsers";

export default function CustomerUsers() {
  return (
    <ManageUsers
      roleFilter="customers"
      title="Customers"
      subtitle="Customers yahin rahenge jab tak admin unhe delivery boy nahi banata."
    />
  );
}
