import Playlist from "../models/Playlist.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// @desc    Create a new playlist
// @route   POST /api/playlists
// @access  Private
export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, isPrivate } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Playlist name is required");
  }

  const playlist = await Playlist.create({
    name,
    user: req.user._id,
    isPrivate: isPrivate || false,
    videos: [],
  });

  res.status(201).json(playlist);
});

// @desc    Get current user's playlists
// @route   GET /api/playlists/me
// @access  Private
export const getUserPlaylists = asyncHandler(async (req, res) => {
  const playlists = await Playlist.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .populate("videos", "thumbnail");
  res.json(playlists);
});

// @desc    Add video to playlist
// @route   POST /api/playlists/:id/videos
// @access  Private
export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  const playlistId = req.params.id;

  if (!videoId) {
    res.status(400);
    throw new Error("Video ID is required");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    res.status(404);
    throw new Error("Playlist not found");
  }

  // Ensure user owns the playlist
  if (playlist.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to edit this playlist");
  }

  // Check if video already exists
  if (playlist.videos.includes(videoId)) {
    return res.json(playlist); // Already added, return success idempotent
  }

  playlist.videos.push(videoId);
  await playlist.save();

  res.json(playlist);
});

// @desc    Remove video from playlist
// @route   DELETE /api/playlists/:id/videos/:videoId
// @access  Private
export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { id: playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    res.status(404);
    throw new Error("Playlist not found");
  }

  // Ensure user owns the playlist
  if (playlist.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to edit this playlist");
  }

  playlist.videos = playlist.videos.filter(
    (v) => v.toString() !== videoId
  );

  await playlist.save();

  res.json(playlist);
});

// @desc    Get playlist by ID (with videos)
// @route   GET /api/playlists/:id
// @access  Public/Private
export const getPlaylistById = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
    .populate("user", "name avatar")
    .populate("videos");

  if (!playlist) {
    res.status(404);
    throw new Error("Playlist not found");
  }

  // Check visibility
  if (playlist.isPrivate && (!req.user || playlist.user._id.toString() !== req.user._id.toString())) {
    res.status(403);
    throw new Error("This playlist is private");
  }

  res.json(playlist);
});
