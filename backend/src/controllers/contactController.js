import Contact from "../models/Contact.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const uid = req.user?.id || req.user?._id || req.user?.uid || null;

    await Contact.create({
      uid,
      source: uid ? "user" : "public",
      name,
      email,
      subject: subject || "",
      message,
      emailReplyStatus: uid ? "not_required" : "pending",
    });

    res.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

export const getMyContacts = async (req, res) => {
  try {
    const uid = req.user?.id || req.user?._id || req.user?.uid;
    const contacts = await Contact.find({ uid }).sort({ createdAt: 1 });

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: "Failed to load contacts" });
  }
};
