const mongoose = require('mongoose');

const desktopAppAssetSchema = mongoose.Schema(
    {
        platform: {
            type: String,
            required: true,
            default: 'windows',
            unique: true,
        },
        title: {
            type: String,
            default: 'SamVidyaa Desktop',
        },
        version: {
            type: String,
            default: 'Latest',
        },
        filename: {
            type: String,
            required: true,
        },
        file_path: {
            type: String,
            required: true,
        },
        mime_type: {
            type: String,
            default: 'application/octet-stream',
        },
        file_size: {
            type: Number,
            default: 0,
        },
        download_count: {
            type: Number,
            default: 0,
        },
        uploaded_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const DesktopAppAsset = mongoose.model('DesktopAppAsset', desktopAppAssetSchema);

module.exports = DesktopAppAsset;
