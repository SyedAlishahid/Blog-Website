const mongoose = require("mongoose");
const { User } = require("../models/user.js"); // FIXED
const { VideoUploader } = require("../cloundinary/cloudinary.js");
const bcrypt = require("bcrypt");
const { blog } = require("../models/blog.js");
// ------------------ TOKEN GENERATION ------------------
async function generateToken(id) {
  try {
    const userinfo = await User.findById(id); // FIXED

    if (!userinfo) {
      throw new Error("User not found");
    }

    const accessToken = userinfo.generateToken(); // FIXED
    const refreshToken = userinfo.generateRefreshToken(); // FIXED

    userinfo.refreshToken = refreshToken; // FIXED

    await userinfo.save({ validateBeforeSave: false }); // FIXED

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("Token generation error:", error.message);
    throw error;
  }
}

// ------------------ SIGNUP ------------------
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Any field is missing!",
      });
    }

    const existedUser = await User.findOne({ email }); // FIXED

    if (existedUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const CheckPhoto = req.files?.photo?.[0]?.path;

    if (!CheckPhoto) {
      return res.status(400).json({
        success: false,
        message: "Image is required!",
      });
    }

    const uploadImg = await VideoUploader(CheckPhoto); // FIXED
    if (!uploadImg) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed",
      });
    }
    console.log(uploadImg);
    const newUser = await User.create({
      username,
      email,
      password,
      photo: uploadImg.url,
    });

    const hideCreds = await User.findById(newUser.id).select(
      "-password -refreshToken",
    );

    return res.status(200).json({
      success: true,
      user: hideCreds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ------------------ LOGIN ------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      return res.status(400).json({
        success: false,
        message: "Without Email or password you can`t Login!~",
      });
    }

    const findEmail = await User.findOne({ email }); // FIXED

    if (!findEmail) {
      return res.status(400).json({
        success: false,
        message: "Email not found!",
      });
    }
    const passChecker = await findEmail.comparePassword(password);

    console.log(passChecker);
    if (!passChecker) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password!",
      });
    }

    const hideCreds = await User.findById(findEmail.id).select(
      "-password -refreshToken",
    );

    const { accessToken, refreshToken } = await generateToken(findEmail.id);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        message: "Login successful",
        user: hideCreds,
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ------------------ FORGET PASSWORD ------------------
const forgetpassword = async (req, res) => {
  try {
    const { oldPass, newPass } = req.body;

    const userInfo = await User.findById(req.user?._id); // FIXED

    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const comparePassword = await userInfo.comparePassword(oldPass);

    if (!comparePassword) {
      return res.status(400).json({
        success: false,
        message: "Wrong old password!",
      });
    }

    userInfo.password = newPass;
    await userInfo.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ------------------ SIGN OUT ------------------
const signOut = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user?._id, // FIXED
      { $set: { refreshToken: null } },
      { new: true },
    );

    const opt = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", accessToken, opt)
      .clearCookie("refreshToken", refreshToken, opt)
      .json({
        success: true,
        message: "Signed out successfully!",
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const userDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Worong user ID~",
      });
    }

    const userInfo = await User.findById(userId);
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User not found~",
      });
    }

    return res.status(200).json({
      success: true,
      user: userInfo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createBlog = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Without title or description blog can`t be created!",
      });
    }

    const blogImg = req.files?.image?.[0]?.path;
    if (!blogImg) {
      return res.status(400).json({
        success: false,
        message: "Without blog-image, blog can`t be created!",
      });
    }

    const uploadOnCloudinary = await VideoUploader(blogImg);
    const blogdata = await blog.create({
      title,
      description,
      image: uploadOnCloudinary.url,
      author: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "blog Created Successfully!",
      blog: blogdata,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    const { newTitle, newDescription } = req.body;
    if (!newTitle || !newDescription) {
      return res.status(400).json({
        success: false,
        message: "Description or title 1 or 2 field needed!",
      });
    }
    const updatedPost = await blog.findByIdAndUpdate(
      blogId,
      {
        title: newTitle,
        description: newDescription,
      },
      { new: true, runValidators: true },
    );

    if (!updatedPost) {
      return res.status(400).json({
        success: false,
        message: "Post cant updated !",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post updated successfully!",
      updatedPost: updatedPost,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const postId = req.params.id;

    const deletePost = await blog.findByIdAndDelete(postId);

    if (!deletePost) {
      return res.status(400).json({
        success: false,
        message: "Post cant be delete~",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const followBtnHandler = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID~",
      });
    }

    const userInfo = req.user;
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User not found~",
      });
    }

    const increamentFollower = await blog.findByIdAndUpdate(
      blogId,
      //$addToSet adds userInfo to the follow
      // array only if it's not already there — this prevents duplicate follows
      { $addToSet: { follow: userInfo._id } },
      { new: true },
    );

    if (!increamentFollower) {
      return res.status(400).json({
        success: false,
        message: "While following an error occurs!",
      });
    }

    const follower = await blog.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(blogId) } },
      {
        $project: {
          followerCount: { $size: "$follow" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      followers: follower[0].followerCount,
      followersDetails: increamentFollower.follow,
      message: "Channel followed successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const unFollowHandler = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID~",
      });
    }

    const userInfo = req.user;
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User not found~",
      });
    }

    const unFollow = await blog.findByIdAndUpdate(
      blogId,
      { $pull: { follow: userInfo._id } },
      { new: true },
    );

    if (!unFollow) {
      return res.status(400).json({
        success: false,
        message: "Error occurs while unfollowing~",
      });
    }

    const listOfFollower = unFollow.follow.length;

    return res.status(200).json({
      success: true,
      followers: listOfFollower,
      followersDetails: unFollow.follow,
      message: "Channel unfollowed successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const likeHandler = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID~",
      });
    }

    const userInfo = req.user;
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User not found~",
      });
    }

    const appendUserId = await blog.findByIdAndUpdate(
      blogId,
      { $addToSet: { likes: userInfo._id } },
      {
        new: true,
      },
    );

    if (!appendUserId) {
      return res.status(400).json({
        success: false,
        message: "Error occurs while liking~",
      });
    }

    const countLikes = await blog.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(blogId) } },
      {
        $project: {
          likesCount: { $size: "likes" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Blog liked successfully~",
      likes: countLikes,
      UserId: appendUserId.likes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const disLikeHandler = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID~",
      });
    }

    const userInfo = req.user;
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User not found~",
      });
    }

    const disLike = await blog.findByIdAndUpdate(
      blogId,
      { $pull: { likes: userInfo._id } },
      { new: true },
    );

    if (!disLike) {
      return res.status(400).json({
        success: false,
        message: "Error occur while disliking~",
      });
    }

    const countDislikes = disLike.likes.length;

    return res.status(200).json({
      success: true,
      disLikes: disLike.likes,
      dislikesCount: countDislikes,
      message: "Channel unfollowed successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const commentHandler = async (req, res) => {
  try {
    const { comment } = req.body; // ✅ only string
    const userInfo = req.user;
    const { blogId } = req.params;

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Blog not found~",
      });
    }

    const addComment = await blog.findByIdAndUpdate(
      blogId,
      {
        $push: {
          comments: {
            user: userInfo._id,
            comment: comment,
          },
        },
      },
      { returnDocument: "after" },
    );

    return res.status(200).json({
      success: true,
      comment: addComment.comments,
      message: "Comment Added successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    if (!blogId || !commentId) {
      return res.status(400).json({
        success: false,
        message: "Blog or comments id not found~",
      });
    }

    const deleteComments = await blog.findByIdAndUpdate(
      blogId,
      {
        $pull: {
          comments: { _id: commentId },
        },
      },
      { new: true },
    );
    if (!deleteComments) {
      return res.status(400).json({
        success: false,
        message: "Wrong ID in the url~",
      });
    }

    return res.status(200).json({
      success: true,
      commentStatus: "Comment deleted Successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
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
};
