import User from "../models/User.js";

const normalizeRole = (role) => (role === "user" ? "customer" : role);

export const getAllUsers = async (req,res)=>{

try{

const users = await User.find({})
.select("-password -resetPasswordToken")
.sort({createdAt:-1})
.lean();

res.json(users);

}catch(err){

res.status(500).json({
message:"Server error"
});

}

};

export const updateUserStatus = async (req,res)=>{

try{

await User.findByIdAndUpdate(
req.params.id,
{
  status:req.body.status,
  blocked: req.body.status === "Blocked"
}
);

res.json({
success:true
});

}catch(err){

res.status(500).json({
message:"Server error"
});

}

};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["customer", "deliveryBoy", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (String(req.params.id) === String(req.user.id) && role !== "admin") {
      return res.status(400).json({ message: "You cannot remove your own admin role" });
    }

    const update = { role };
    if (role === "deliveryBoy") {
      update.deliveryCredit = 0;
      update.deliveryDetails = {
        profileCompleted: false,
        address: "",
        updatedAt: new Date(),
        changeLog: [],
      };
    } else {
      update["deliveryDetails.profileCompleted"] = false;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user: { ...user.toObject(), role: normalizeRole(user.role) } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
