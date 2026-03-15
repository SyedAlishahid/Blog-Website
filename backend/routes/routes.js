const {
  signup,
  login,
  forgetpassword,
  signOut,
  userDetails,
  createBlog,
  updateBlog,
  deleteBlog,
  followBtnHandler,
  unFollowHandler,
  likeHandler,
  disLikeHandler,
  commentHandler,
  deleteComment,
} = require("../controller/controller.js");

const express = require("express");
const router = express.Router();

const { VerifyJWT } = require("../middleware/auth.js");
const upload = require("../multer/multer.js");

// SIGNUP
router.post(
  "/sign-up",
  upload.fields([{ name: "photo", maxCount: 1 }]),
  signup,
);

// LOGIN
router.post("/login", login);

// FORGET PASSWORD
router.patch("/forget-password", VerifyJWT, forgetpassword);

// SIGN OUT
router.post("/sign-out", VerifyJWT, signOut);

router.post("/user/:userId", VerifyJWT, userDetails);
// CREATE BLOG  (FIXED)
router.post(
  "/create-blog",
  VerifyJWT,
  upload.fields([{ name: "image", maxCount: 1 }]),
  createBlog,
);

// UPDATE BLOG
router.patch("/update-blog/:blogId", VerifyJWT, updateBlog);

// DELETE BLOG
router.delete("/delete-blog/:postId", VerifyJWT, deleteBlog);

router.post("/follow/:blogId", VerifyJWT, followBtnHandler);

router.post("/unfollow/:blogId", VerifyJWT, unFollowHandler);

router.post("/like/:blogId", VerifyJWT, likeHandler);

router.post("/dislike/:blogId", VerifyJWT, disLikeHandler);

router.post("/comment/:blogId", VerifyJWT, commentHandler);

router.delete("/delete-comment/:blogId/:commentId", VerifyJWT, deleteComment);

module.exports = router;
