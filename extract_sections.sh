#!/bin/bash

# Define the input file
INPUT_FILE="docs/specification.md"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' not found."
    exit 1
fi

# Create output directory if it doesn't exist
OUTPUT_DIR="docs/sections"
mkdir -p "$OUTPUT_DIR"

# Get the list of section headers
SECTIONS=($(grep -n "^## [0-9]\+\." "$INPUT_FILE" | cut -d: -f1))
SECTION_COUNT=${#SECTIONS[@]}

# Process each section
for ((i=0; i<SECTION_COUNT; i++)); do
    # Get the current section line number
    START_LINE=${SECTIONS[i]}
    
    # Get the section title
    TITLE=$(sed -n "${START_LINE}p" "$INPUT_FILE" | sed 's/^## //')
    
    # Create a filename from the title
    # Extract section number, keep it in the filename, replace spaces with hyphens, remove special characters
    SECTION_NUM=$(echo "$TITLE" | grep -o "^[0-9]\+")
    SECTION_NAME=$(echo "$TITLE" | sed 's/^[0-9]\+\. //' | tr ' ' '-' | tr -cd 'a-zA-Z0-9-')
    FILENAME="$OUTPUT_DIR/${SECTION_NUM}-${SECTION_NAME}.md"
    
    # Determine the end line for this section
    if [ $((i + 1)) -lt "$SECTION_COUNT" ]; then
        # If not the last section, the end is the line before the next section
        END_LINE=$((${SECTIONS[i+1]} - 1))
    else
        # If it's the last section, the end is the end of the file
        END_LINE=$(wc -l < "$INPUT_FILE")
    fi
    
    # Extract the section content including the header
    echo "Extracting: $TITLE to $FILENAME"
    sed -n "${START_LINE},${END_LINE}p" "$INPUT_FILE" > "$FILENAME"
    
    # Add a note at the top of the file indicating its source
    TMP_FILE=$(mktemp)
    echo "<!-- Extracted from the A2A Protocol Specification -->" > "$TMP_FILE"
    echo "<!-- Source: docs/specification.md -->" >> "$TMP_FILE"
    echo "" >> "$TMP_FILE"
    cat "$FILENAME" >> "$TMP_FILE"
    mv "$TMP_FILE" "$FILENAME"
done

echo "Extraction complete. Files saved to $OUTPUT_DIR/"
