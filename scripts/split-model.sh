#!/bin/bash

# Script to split large model file into chunks for Android assets
# Android has a limit of ~1GB per asset file

MODEL_FILE="$1"
OUTPUT_DIR="android/app/src/main/assets/models"
CHUNK_SIZE="900M"  # 900MB chunks to stay under 1GB limit

if [ -z "$MODEL_FILE" ]; then
    echo "Usage: ./scripts/split-model.sh <path-to-model.gguf>"
    exit 1
fi

if [ ! -f "$MODEL_FILE" ]; then
    echo "Error: Model file not found: $MODEL_FILE"
    exit 1
fi

echo "Splitting model file: $MODEL_FILE"
echo "Output directory: $OUTPUT_DIR"
echo "Chunk size: $CHUNK_SIZE"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Get the base filename
BASENAME=$(basename "$MODEL_FILE")

# Split the file
split -b $CHUNK_SIZE "$MODEL_FILE" "$OUTPUT_DIR/${BASENAME}.part"

echo "Model split complete!"
echo "Chunks created in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
