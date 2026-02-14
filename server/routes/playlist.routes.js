import express from "express";
import protect from "../middleware/protect.js";
import {
  createPlaylist,
  getUserPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistById,
} from "../controllers/playlist.controller.js";

const router = express.Router();

router.route("/").post(protect, createPlaylist);
router.route("/me").get(protect, getUserPlaylists);
router.route("/:id").get(protect, getPlaylistById); // optional protection inside controller if we wanted public playlists
router.route("/:id/videos").post(protect, addVideoToPlaylist);
router.route("/:id/videos/:videoId").delete(protect, removeVideoFromPlaylist);

export default router;
