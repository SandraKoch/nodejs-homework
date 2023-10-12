const express = require("express");
// const Joi = require("joi");
const {
  listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact,
  updateContactStatus,
} = require("./contacts.service");
const { contactValidation } = require("./contact.validator");
const { authMiddleware } = require("../auth/auth.service");

const router = express.Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const contacts = await listContacts(req.userId);
    res.status(200).json({ status: "Success", code: 200, contacts });
  } catch (error) {
    console.error(error.messsage);
    res
      .status(404)
      .json({ status: "Not found", code: 404, message: "No data found" });
  }
});

router.get("/:contactId", authMiddleware, async (req, res, next) => {
  try {
    const contact = await getContactById(req.params.contactId, req.userId);
    if (!contact) {
      res
        .status(404)
        .json({ status: "Not Found", code: 404, message: "Contact not found" });
    } else {
      res.status(200).json({
        status: "Success",
        code: 200,
        message: `Contact with id: ${req.params.contactId} found`,
        contact,
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error", code: 500 });
  }
});

router.post(
  "/",
  authMiddleware,
  (req, res, next) => contactValidation(req, res, next),
  async (req, res) => {
    try {
      const newContact = await addContact(req.body, req.userId);
      res.status(201).json({
        status: "Created",
        code: 201,
        message: "Success! New contact added",
        newContact,
      });
    } catch {
      res.status(500).json({ status: "Internal Server Error", code: 500 });
    }
  }
);

router.delete("/:contactId", authMiddleware, async (req, res) => {
  try {
    const removeResponse = await removeContact(
      req.params.contactId,
      req.userId
    );
    if (removeResponse && removeResponse.deletedCount > 0) {
      res.status(204).json({
        status: "No Content",
        code: "204",
        message: "Contact successfully deleted",
      });
    } else {
      res
        .status(404)
        .json({ status: "Not found", code: 404, message: "Contact not found" });
    }
  } catch (error) {
    res.status(500).json({ status: "Internal Server Error", code: 500 });
  }
});

router.put(
  "/:contactId",
  authMiddleware,
  (req, res, next) => contactValidation(req, res, next),
  async (req, res, next) => {
    try {
      const { contactId } = req.params;
      const updatedContact = await updateContact(
        contactId,
        req.body,
        req.userId
      );
      if (updatedContact) {
        res.status(200).json({
          status: "OK",
          code: "200",
          message: "Contact updated",
          updatedContact,
        });
      } else {
        res.status(404).json({
          status: "Not found",
          code: 404,
          message: "Cannot update. Contact not found",
        });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ status: "Internal Server Error", code: 500 });
    }
  }
);

router.patch("/:contactId/favorite", authMiddleware, async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: "Bad Request",
        code: "400",
        message: "Missing field: favorite",
      });
    } else {
      const { contactId } = req.params;
      const updatedStatus = await updateContactStatus(
        contactId,
        req.body,
        req.userId
      );
      if (updatedStatus) {
        res.status(200).json({
          status: "OK",
          code: "200",
          message: "Contact status updated",
          updatedStatus,
        });
      } else {
        return res.status(404).json({
          status: "Not Found",
          code: 404,
          message:
            "Contact not found or status has not changed (set a different status)",
        });
      }
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: "Internal Server Error", code: 500 });
  }
});

module.exports = router;
