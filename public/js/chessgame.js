const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);

                // Allow dragging only if the piece matches the player's role
                if (square.color === playerRole) {
                    pieceElement.draggable = true;

                    pieceElement.addEventListener("dragstart", (e) => {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", ""); // Required for dragstart to work
                    });

                    pieceElement.addEventListener("dragend", () => {
                        draggedPiece = null;
                        sourceSquare = null;
                    });
                }
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q", // Always promote to queen for simplicity
    };
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    switch (piece.type) {
        case "p": return piece.color === "w" ? "♙" : "♟";
        case "r": return piece.color === "w" ? "♖" : "♜";
        case "n": return piece.color === "w" ? "♘" : "♞";
        case "b": return piece.color === "w" ? "♗" : "♝";
        case "q": return piece.color === "w" ? "♕" : "♛";
        case "k": return piece.color === "w" ? "♔" : "♚";
        default: return "";
    }
};

// Player role assignment
socket.on("playerRole", (role) => {
    playerRole = role;
    alert(`You are playing as ${role === "w" ? "White" : "Black"}.`);
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    alert("You are viewing the game as a spectator.");
    renderBoard();
});

// Update the board state
socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

// Update the board on a move
socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

// Handle game over and display the winner
socket.on("gameOver", ({ winner }) => {
    alert(`Checkmate! ${winner} wins!`);
    chess.reset(); // Reset the local game state
    renderBoard();
});

// Initial render of the board
renderBoard();
