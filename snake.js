// Tên: Võ Phi Hoàng
// MSSV: 21130363
// SĐT: 0355450523
// Lớp: DH21DTB

let fps;
const columns = 36;
const rows = 36;
const snakeStartLength = 3;
let score = 0;
let counter = 0;
let enableKillBox = false;
let enableBarrier = false;
let enableMaze = false;

/**
 * Hướng di chuyển của rắn
 */
const directions = {
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    UP: 'UP',
    DOWN: 'DOWN',
};

const controls = {
    ESC: 'ESC',
};

/**
 Bảng mã phím tương ứng với hướng di chuyển
 */
const keys = {
    38: 'UP',
    40: 'DOWN',
    37: 'LEFT',
    39: 'RIGHT',
    27: 'ESC',
};

/** Đối tượng rắn */
let snake = {
    direction: directions.RIGHT, // Hướng ban đầu của rắn là sang phải
    isMoving: false, // Trạng thái di chuyển của rắn
    body: [
        {
            x: columns / 2, // Tọa độ x ban đầu của đầu rắn
            y: columns / 2, // Tọa độ y ban đầu của đầu rắn
        },
    ],
    size: snakeStartLength, // Kích thước ban đầu của rắn
    grow: false, // Biến đánh dấu rắn có phải đang mở rộng không
    growLocate: {}, // Vị trí mở rộng của rắn
    gemStack: [], // Mảng chứa các viên ngọc đã ăn
    keyProcessing: false, // Biến đánh dấu quá trình xử lý phím
};

/** Khởi tạo độ dài ban đầu của rắn và thêm các phần tử vào body của rắn */
for (let i = 1; i <= snakeStartLength; i++) {
    snake.body.push({
        x: columns / 2 - i,
        y: columns / 2,
    });
}

/** Trạng thái của trò chơi */
let gameState = {
    // Vị trí của viên ngọc
    gem: {
        x: 0,
        y: 0,
    },
    // Vị trí của viên ngọc lớn
    bigGem: undefined,
    // Vị trí của các thanh chắn
    barriers: [],
    // Vị trí của các thanh chắn trong mê cung
    maze: [],
    isRunning: false,
    isGameOver: false,
};

let cells = [];
/**Hàm tạo lưới trò chơi */
const createGrid = () => {
    const game = document.getElementById('game');
    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < columns; y++) {
            const element = document.createElement('cell'); // Tạo phần tử cell mới
            element.setAttribute('id', `${y}-${x}`); // Thiết lập id cho ô
            cells.push({ y, x }); // Thêm tọa độ của ô vào mảng cells
            game.appendChild(element); // Thêm ô vào phần tử game
        }
    }
    game.style = `grid-template-columns: repeat(${columns}, 1fr)`; // Thiết lập kiểu lưới
};

/** Hàm lấy ô trên lưới dựa trên tọa độ x và y */
const getCell = (x, y) => document.getElementById(`${x}-${y}`);

/**Hàm lấy ô trên lưới dựa trên chuỗi id */
const getCellByString = (str) => document.getElementById(str);

/** Hàm đặt lại class của tất cả các ô trên lưới */
const reset = () => {
    const cells = document.getElementsByTagName('cell'); // Lấy tất cả các ô trên lưới
    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        // Đặt lại lớp của mỗi ô
        cell.setAttribute('class', '');
    }
};

/** Hàm vẽ rắn trên lưới */
const drawSnake = () => {
    // Duyệt qua mỗi phần tử trong body của rắn, trừ đầu và đuôi
    for (let i = 1; i < snake.body.length - 1; i++) {
        const x = snake.body[i].x;
        const y = snake.body[i].y;
        getCell(x, y).setAttribute('class', 'snake');
    }

    // Đặt lớp "snake head" cho ô đầu tiên của rắn
    const snakeHead = snake.body[0];
    getCell(snakeHead.x, snakeHead.y).setAttribute('class', 'snake head');

    // Đặt lớp "snake tail" cho ô cuối cùng của rắn
    const snakeTail = snake.body[snake.body.length - 1];
    getCell(snakeTail.x, snakeTail.y).setAttribute('class', 'snake tail');
};

/** Hàm vẽ các viên ngọc đã ăn trên lưới */
const drawEatGems = () => {
    snake.gemStack.forEach((gem) => getCell(gem.x, gem.y).setAttribute('class', 'snake eatGem'));
};

/** Hàm được sử dụng xử lý các phím được nhấn. */
const setListeners = () => {
    // Hàm được gọi khi một phím được nhấn
    const handleKey = ({ keyCode }) => {
        if (gameState.isGameOver) return;

        // Kiểm tra xem mã phím nhấn có tồn tại trong danh sách các phím được định nghĩa hay không
        if (!Object.keys(keys).includes(`${keyCode}`)) return;

        if (!snake.isMoving) {
            snake.isMoving = true;
        }

        // Nếu trò chơi chưa bắt đầu thì bắt đầu trò chơi
        if (!gameState.isRunning) {
            gameState.isRunning = true;
            document.getElementById('game').setAttribute('paused', 'false');
            startGameLoop();
            removeOverlay();
            document.getElementById('selectMode').disabled = true;
        }
        // Nếu đang xử lý phím, không làm gì cả
        if (snake.keyProcessing) return;

        // Lấy hướng di chuyển từ mã phím được nhấn
        const key = keys[keyCode];

        // Xử lý hướng di chuyển dựa trên phím được nhấn
        switch (key) {
            case directions.UP:
                if (snake.direction != directions.DOWN) snake.direction = directions.UP;
                break;
            case directions.DOWN:
                if (snake.direction != directions.UP) snake.direction = directions.DOWN;
                break;
            case directions.LEFT:
                if (snake.direction != directions.RIGHT) snake.direction = directions.LEFT;
                break;
            case directions.RIGHT:
                if (snake.direction != directions.LEFT) snake.direction = directions.RIGHT;
                break;
            case controls.ESC:
                // Hiển thị overlay nếu phím ESC được nhấn
                showOverlay(false);
                break;
        }

        // Đánh dấu rằng đang xử lý phím
        snake.keyProcessing = true;
    };

    document.onkeydown = handleKey;
};

/** Hàm được sử dụng để di chuyển con rắn */
const moveSnake = () => {
    if (!snake.isMoving) return;

    // Lưu lại vị trí trước đó của đầu rắn
    let prevTrack = {
        x: snake.body[0].x,
        y: snake.body[0].y,
    };

    // Di chuyển đầu rắn dựa vào hướng di chuyển hiện tại
    switch (directions[snake.direction]) {
        case directions.UP:
            snake.body[0].y -= 1;
            // Nếu không có hộp giết rắn và đầu rắn đi ra ngoài màn hình ở phía trên,
            // đặt lại vị trí của đầu rắn ở phía dưới màn hình
            if (enableKillBox) break;
            if (snake.body[0].y < 0) {
                snake.body[0].y = columns - 1;
            }
            break;
        case directions.DOWN:
            snake.body[0].y += 1;
            // Nếu không có hộp giết rắn và đầu rắn đi ra ngoài màn hình ở phía dưới,
            // đặt lại vị trí của đầu rắn ở phía trên màn hình
            if (enableKillBox) break;
            if (snake.body[0].y >= columns) {
                snake.body[0].y = 0;
            }
            break;
        case directions.LEFT:
            snake.body[0].x -= 1;
            // Nếu không có hộp giết rắn và đầu rắn đi ra ngoài màn hình ở bên trái,
            // đặt lại vị trí của đầu rắn ở phía phải màn hình
            if (enableKillBox) break;
            if (snake.body[0].x < 0) {
                snake.body[0].x = columns - 1;
            }
            break;
        case directions.RIGHT:
            snake.body[0].x += 1;
            // Nếu không có hộp giết rắn và đầu rắn đi ra ngoài màn hình ở bên phải,
            //đặt lại vị trí của đầu rắn ở phía trái màn hình
            if (enableKillBox) break;
            if (snake.body[0].x >= columns) {
                snake.body[0].x = 0;
            }
            break;
    }

    // Di chuyển các phần thân của rắn, vì phần đầu (i = 0) sẽ được xử lý riêng
    for (let i = 1; i < snake.body.length; i++) {
        // Lưu trữ vị trí hiện tại của phần thân đang được xử lý vào biến tạm thời tempTrack
        let tempTrack = { ...snake.body[i] };
        // Di chuyển phần thân đang xử lý đến vị trí của phần thân trước đó (prevTrack)
        snake.body[i] = { ...prevTrack };
        // Cập nhật vị trí trước đó của phần thân đang xử lý để sử dụng cho phần thân tiếp theo
        prevTrack = tempTrack;
    }

    // Nếu rắn phát triển, thêm một phần thân mới
    if (snake.grow) {
        growSnake();
    }

    // Kiểm tra va chạm với tường hoặc chính rắn
    checkCollision();

    // Xử lý việc ăn gem
    eatGem();

    // Xử lý việc ăn big gem (nếu có)
    eatBigGem();

    // Đánh dấu rằng không còn xử lý phím nữa
    snake.keyProcessing = false;
};

/** Hàm được sử dụng để mở rộng độ dài của con rắn sau khi ăn một viên gem. */
const growSnake = () => {
    // Đặt cờ grow là false để ngăn việc con rắn tiếp tục mở rộng trong lượt di chuyển tiếp theo.
    snake.grow = false;
    // Tăng kích thước của con rắn lên một đơn vị.
    snake.size += 1;
    // Thêm một phần thân mới vào cuối của con rắn
    snake.body.push({
        x: snake.growLocate.x,
        y: snake.growLocate.y,
    });
};

/** Hàm được sử dụng để đặt lại vị trí của viên gem trên lưới */
const resetGem = () => {
    const availableCells = getAvailableCells();
    // Chọn ngẫu nhiên một ô trống từ danh sách các ô trống.
    const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
    // Đặt vị trí của viên gem tại ô trống được chọn ngẫu nhiên.
    gameState.gem = randomCell;
};

/** Hàm được sử dụng để vẽ viên ngọc trên lưới. */
const drawGem = () => {
    const gem = getCell(gameState.gem.x, gameState.gem.y);
    gem.setAttribute('class', 'gem');
};

let gameLoop;
/** Hàm được sử dụng để bắt đầu vòng lặp chính của trò chơi */
const startGameLoop = () => {
    // Sử dụng setInterval để gọi liên tục hàm draw và moveSnake với tốc độ cố định (fps).
    gameLoop = setInterval(() => {
        try {
            draw();
        } catch (e) {
            // Hiển thị overlay của trò chơi để thông báo kết thúc trò chơi khi bị lỗi
            showOverlay(true);
        }
        // Di chuyển con rắn trong mỗi khung hình.
        moveSnake();
    }, 1000 / fps);
};

/** Hàm xử lý việc con rắn ăn viên ngọc. */
const eatGem = () => {
    const snakeHead = snake.body[0];
    const gemLocation = gameState.gem;
    // Kiểm tra nếu đầu của con rắn trùng vị trí với viên ngọc.
    if (snakeHead.x === gemLocation.x && snakeHead.y === gemLocation.y) {
        // Thêm vị trí của viên gem vào ngăn xếp gemStack để hiển thị sau này.
        snake.gemStack.push({
            x: gemLocation.x,
            y: gemLocation.y,
        });
        resetGem();
        // Tăng điểm số của người chơi lên một đơn vị.
        score += 1;
        counter += 1;
        if (counter % 5 === 0) {
            createBigGem();
        }
    }
    handleEatGemStack();
};

/** Xử lý khi con rắn ăn viên ngọc lớn. */
const eatBigGem = () => {
    const snakeHead = snake.body[0];
    const gemLocation = gameState.bigGem;
    // Kiểm tra nếu đầu của con rắn trùng vị trí với viên ngọc lớn.
    if (gemLocation !== undefined && snakeHead.x === gemLocation.x && snakeHead.y === gemLocation.y) {
        // Thêm vị trí của viên gem vào ngăn xếp gemStack để hiển thị sau này.
        snake.gemStack.push({
            x: gemLocation.x,
            y: gemLocation.y,
        });
        gameState.bigGem = undefined;
        // Tăng điểm số của người chơi
        score += 3;

        // Reset bộ đếm.
        counter = 0;
    }
    handleEatGemStack();
};

/** Lấy danh sách các ô trống trên lưới. */
const getAvailableCells = () => {
    return cells.filter((cell) => {
        // Kiểm tra xem ô có chứa phần thân của con rắn không
        const hasSnake = snake.body.some((snakeCell) => snakeCell.x === cell.x && snakeCell.y === cell.y);
        // Kiểm tra xem ô có chứa rào cản không
        const hasBarrier = gameState.barriers.some(
            (barrierCell) => barrierCell.x === cell.x && barrierCell.y === cell.y,
        );
        // Kiểm tra xem ô có chứa viên ngọc không
        const hasGem = gameState.gem && gameState.gem.x === cell.x && gameState.gem.y === cell.y;
        // Kiểm tra xem ô có chứa viên ngọc đặc biệt không
        const hasBigGem = gameState.bigGem && gameState.bigGem.x === cell.x && gameState.bigGem.y === cell.y;
        // Kiểm tra xem ô có chứa đường đi trong mê cung không
        const hasMaze = gameState.maze.some((path) => path.x === cell.x && path.y === cell.y);

        // Trả về true nếu ô không chứa con rắn, rào cản, viên ngọc, đường đi trong mê cung và viên ngọc đặc biệt (nếu có)
        return !hasSnake && !hasBarrier && !hasGem && !hasMaze && !(gameState.bigGem && hasBigGem);
    });
};

/** Xử lý khi con rắn ăn viên ngọc trong ngăn xếp gemStack. */
const handleEatGemStack = () => {
    const bodyLength = snake.body.length - 1;
    snake.gemStack.forEach((gem, index) => {
        // Nếu phần thân của con rắn đến vị trí của viên ngọc trong ngăn xếp gemStack.
        if (snake.body[bodyLength].x == gem.x && snake.body[bodyLength].y == gem.y) {
            // Xóa viên ngọc từ ngăn xếp gemStack.
            snake.gemStack.splice(index, 1);
            // Đặt cờ grow để con rắn mở rộng sau lượt di chuyển hiện tại.
            snake.grow = true;
            // Lưu vị trí của viên ngọc được ăn để mở rộng con rắn.
            snake.growLocate = gem;
        }
    });
};

/**Hiển thị lớp phủ khi trò chơi kết thúc.*/
const showOverlay = (isGameOver) => {
    // Dừng vòng lặp chính của trò chơi.
    clearInterval(gameLoop);
    gameState.isRunning = false;
    // Đặt thuộc tính paused của trò chơi là true để ngừng di chuyển con rắn.
    document.getElementById('game').setAttribute('paused', 'true');

    // Chọn overlay tương ứng để hiển thị (game over hoặc tạm dừng).
    let overlayDoc;
    if (isGameOver) {
        overlayDoc = document.getElementById('overlayGameOver');
        gameState.isGameOver = true;
        // Kiểm tra và cập nhật thuộc tính disabled
        document.getElementById('selectMode').disabled = false;
    } else {
        overlayDoc = document.getElementById('overlayPause');
    }

    showHighestScore();

    // Hiển thị overlay lên màn hình.
    overlayDoc.style = 'display: flex';
};

/** Hiển thị điểm số cao nhất */
const showHighestScore = () => {
    // Lấy điểm số cao nhất từ local storage, so sánh và cập nhật.
    let highestScore = localStorage.getItem('highestScore') || 0;
    highestScore = Math.max(highestScore, score);
    localStorage.setItem('highestScore', highestScore);

    // Hiển thị điểm số cao nhất.
    const highestScoreDoc = document.getElementById('highestScore');
    highestScoreDoc.innerHTML = `Điểm cao nhất: ${highestScore}`;
};

/** Hàm được sử dụng để loại bỏ lớp phủ khi trò chơi tiếp tục sau khi tạm dừng. */
const removeOverlay = () => {
    document.getElementById('overlayPause').style = 'display: none';
    document.getElementById('overlayGameOver').style = 'display: none';
};

/** Hàm được sử dụng để kiểm tra va chạm của con rắn với bản thân mình. */
const checkCollision = () => {
    // Lấy đầu của con rắn.
    const head = snake.body[0];
    for (let i = 1; i < snake.body.length; i++) {
        // Nếu đầu của con rắn trùng với phần thân nào đó, hiển thị overlay game over.
        if (snake.body[i].x === head.x && snake.body[i].y === head.y) {
            showOverlay(true);
        }
    }

    gameState.barriers.forEach((barrier) => {
        // Nếu đầu của con rắn trùng với barrier.
        if (head.x === barrier.x && head.y === barrier.y) {
            showOverlay(true);
        }
    });
};

/** Hàm được sử dụng để cập nhật điểm số */
const updateScore = () => {
    // Lấy phần tử hiển thị điểm số từ DOM.
    const scoreDoc = document.getElementById('score');

    // Nếu con rắn đang di chuyển, hiển thị điểm số hiện tại, ngược lại hiển thị hướng dẫn bắt đầu trò chơi.
    if (snake.isMoving) {
        // Hiển thị điểm số hiện tại.
        scoreDoc.innerHTML = `Điểm: ${score}`;
        showHighestScore();
    } else {
        // Hiển thị hướng dẫn bắt đầu trò chơi khi con rắn chưa di chuyển.
        scoreDoc.innerHTML = `Nhấn phím di chuyển bất kì để bắt đầu`;
    }
};

/** Hàm được sử dụng để vẽ toàn bộ trạng thái của trò chơi trên lưới. */
const draw = () => {
    reset();
    drawGem();
    drawSnake();
    drawEatGems();
    updateScore();
    drawBarrier(enableBarrier);
    drawMaze(enableMaze);
    drawBigGem();
};

/** Hàm được sử dụng để hiển thị modal. */
const showRules = () => {
    const ruleBtn = document.querySelector('.js-rule');
    const modal = document.querySelector('.js-modal');
    const modalContainer = document.querySelector('.js-modal-container');

    ruleBtn.addEventListener('click', () => {
        // Khi nút được nhấn, thêm lớp 'open' vào modal để hiển thị nó
        modal.classList.add('open');
        if (!gameState.isGameOver) showOverlay(false);
    });

    modal.addEventListener('click', () => {
        // Khi modal được nhấn (tức nhấn ở phía bên ngoài), loại bỏ lớp 'open' khỏi modal để ẩn nó đi
        modal.classList.remove('open');
    });

    modalContainer.addEventListener('click', (event) => {
        // Ngăn sự kiện click từ việc lan truyền đến các phần tử cha
        event.stopPropagation();
    });
};

/** Hàm được gọi khi người dùng thay đổi mode */
const handleModeChange = () => {
    const selectMode = document.getElementById('selectMode');
    // Lấy giá trị mode được chọn
    const mode = selectMode.value;

    removeBarrier();
    removeMaze();

    if (mode == 'easy') {
        fps = 7;
        toggleKillBox(false);
        enableBarrier = false;
    } else if (mode == 'medium') {
        fps = 10;
        toggleKillBox(true);
        enableBarrier = false;
    } else if (mode == 'hard') {
        fps = 15;
        toggleKillBox(true);
        enableBarrier = true;
        createBarriers();
    } else if (mode == 'maze') {
        fps = 10;
        toggleKillBox(true);
        enableMaze = true;
        createMaze();
    }

    // Khi một mode được chọn, làm cho thẻ select mất focus
    selectMode.blur();

    localStorage.setItem('mode', mode);
};

/** Hàm để khởi tạo giá trị ban đầu cho thẻ select từ localStorage (nếu có) */
const initializeSelectMode = () => {
    const selectMode = document.getElementById('selectMode');
    const mode = localStorage.getItem('mode');
    if (mode) {
        // Nếu giá trị đã được lưu trong localStorage, cập nhật thẻ select
        selectMode.value = mode.toString();
    } else {
        selectMode.value = 'easy';
    }
    handleModeChange();
};

/** Chuyển đổi trạng thái của hộp giết rắn và cập nhật lớp CSS tương ứng cho phần tử game.*/
const toggleKillBox = (isEnable) => {
    // Lấy phần tử game từ DOM
    const gameElement = document.getElementById('game');
    // Cập nhật trạng thái của biến enableKillBox
    enableKillBox = isEnable;
    // Thêm hoặc loại bỏ lớp CSS "kill-box" tùy thuộc vào trạng thái của hộp giết rắn
    if (isEnable) {
        gameElement.classList.add('kill-box');
    } else {
        gameElement.classList.remove('kill-box');
    }
};

const refreshPage = () => {
    location.reload();
};

/**  Vẽ các rào cản trên lưới nếu cờ enableBarrier = true*/
const drawBarrier = (enableBarrier) => {
    if (enableBarrier) {
        gameState.barriers.forEach((barrier) => {
            const barrierLocate = getCell(barrier.x, barrier.y);
            barrierLocate.setAttribute('class', 'barrier');
        });
    }
};

/** Loại bỏ các rào cản khỏi lưới. */
const removeBarrier = () => {
    gameState.barriers.forEach((barrier) => {
        const barrierLocate = getCell(barrier.x, barrier.y);
        barrierLocate.removeAttribute('class', 'barrier');
    });
    // Xóa tất cả các rào cản từ mảng barriers
    gameState.barriers.length = 0;
};

/** Tạo các rào cản trên lưới. */
const createBarriers = () => {
    /**Hàm tính khoảng cách Euclid giữa hai điểm trong mặt phẳng.*/
    const calculateDistance = (coordinatesA, coordinatesB) => {
        const dx = Math.abs(coordinatesA.x - coordinatesB.x);
        const dy = Math.abs(coordinatesA.y - coordinatesB.y);
        return Math.sqrt(dx * dx + dy * dy);
    };

    /**Lọc ra các ô trống trên lưới và không kề với con rắn.*/
    const filterAvailableCells = () => {
        return cells.filter((cell) => {
            const isInRange = cell.x > 0 && cell.x < columns - 1 && cell.y > 0 && cell.y < columns - 1;
            const isNotAdjacentToSnake = !snake.body.some((snakeCell) => {
                return (
                    (Math.abs(cell.x - snakeCell.x) === 1 && cell.y === snakeCell.y) ||
                    (Math.abs(cell.y - snakeCell.y) === 1 && cell.x === snakeCell.x)
                );
            });
            return isInRange && isNotAdjacentToSnake;
        });
    };

    /**Lấy ngẫu nhiên một ô trống từ danh sách các ô trống.*/
    const getRandomCell = (availableCells) => {
        return availableCells[Math.floor(Math.random() * availableCells.length)];
    };

    /**Tạo một rào cản mới trên lưới*/
    const createBarrier = () => {
        const availableCells = filterAvailableCells();
        return getRandomCell(availableCells);
    };

    /**Kiểm tra xem khoảng cách giữa rào cản mới và các rào cản đã có có chấp nhận được không.*/
    const checkAcceptableDistance = (newBarrier, barriers) => {
        return barriers.every((existingBarrier) => {
            const distance = calculateDistance(newBarrier, existingBarrier);
            return distance >= 12;
        });
    };

    /** Thêm các ô rào cản xung quanh ô rào cản chính.*/
    const addBarrierCells = (barrier, direction) => {
        const directions = direction === 'vertical' ? ['x', 'y'] : ['y', 'x'];
        for (let j = -1; j <= 1; j++) {
            if (j !== 0) {
                const barrierCell = {
                    [directions[1]]: barrier[directions[1]] + j,
                    [directions[0]]: barrier[directions[0]],
                };
                gameState.barriers.push(barrierCell);
            }
        }
    };

    //Tạo các rào cản trên lưới.
    const barriers = [];
    for (let i = 0; i < 5; ) {
        const newBarrier = createBarrier();
        if (i === 0 || checkAcceptableDistance(newBarrier, barriers)) {
            barriers.push(newBarrier);
            i++;
        }
    }
    // Thêm các ô rào cản xung quanh
    barriers.forEach((barrier, index) => {
        gameState.barriers.push(barrier);
        const direction = index % 2 === 0 ? 'vertical' : 'horizontal';
        addBarrierCells(barrier, direction);
    });

    drawBarrier(enableBarrier);
};

/** Tạo viên ngọc lớn nếu thỏa điều kiện cho phép. */
const createBigGem = () => {
    if (counter !== 0 && counter % 5 === 0 && gameState.bigGem === undefined) {
        const availableCells = getAvailableCells();
        // Chọn ngẫu nhiên một ô trống từ danh sách các ô trống.
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        // Đặt vị trí của viên gem tại ô trống được chọn ngẫu nhiên.
        gameState.bigGem = randomCell;
    }
};

/** Vẽ viên ngọc lớn nếu nó tồn tại. */
const drawBigGem = () => {
    if (gameState.bigGem !== undefined) {
        const gem = getCell(gameState.bigGem.x, gameState.bigGem.y);
        gem.setAttribute('class', 'gem-big');
    }
};

/** Tạo mê cung trên lưới trò chơi.*/
const createMaze = () => {
    /**
     * Tạo mảng các điểm từ điểm bắt đầu đến điểm kết thúc theo hướng chỉ định.
     */
    const createPath = (startLocation, endLocation, direction, segmentNumber) => {
        const path = [];
        if (direction === 'vertical') {
            const minY = Math.min(startLocation.y, endLocation.y);
            const maxY = Math.max(startLocation.y, endLocation.y);
            for (let y = minY; y <= maxY; y++) {
                path.push({ x: startLocation.x, y, segmentNumber: segmentNumber });
            }
        } else if (direction === 'horizontal') {
            const minX = Math.min(startLocation.x, endLocation.x);
            const maxX = Math.max(startLocation.x, endLocation.x);
            for (let x = minX; x <= maxX; x++) {
                path.push({ x, y: startLocation.y, segmentNumber: segmentNumber });
            }
        }
        return path;
    };

    // Mảng các đoạn mê cung được định nghĩa với các thông tin về điểm bắt đầu, điểm kết thúc, hướng và số thứ tự.
    // Các số 0.2, 0.5,... tương ứng với lấy theo phần trăm của số cột hoặc số dòng
    const mazeSegments = [
        {
            start: { x: 0, y: parseInt(0.2 * columns) },
            end: { x: parseInt(0.5 * columns), y: parseInt(0.2 * columns) },
            direction: 'horizontal',
            segmentNumber: 1,
        },
        {
            start: { x: parseInt(0.5 * columns), y: parseInt(0.2 * columns) - 1 },
            end: { x: parseInt(0.5 * columns), y: parseInt(0.2 * columns) - 3 },
            direction: 'vertical',
            segmentNumber: 2,
        },
        {
            start: { x: parseInt(0.5 * columns), y: parseInt(0.87 * columns) },
            end: { x: parseInt(0.5 * columns), y: columns - 1 },
            direction: 'vertical',
            segmentNumber: 3,
        },
        {
            start: { x: parseInt(0.44 * columns), y: parseInt(0.87 * columns) },
            end: { x: parseInt(0.8 * columns), y: parseInt(0.87 * columns) },
            direction: 'horizontal',
            segmentNumber: 4,
        },
        {
            start: { x: parseInt(0.8 * columns), y: parseInt(0.6 * columns) },
            end: { x: parseInt(0.8 * columns), y: parseInt(0.87 * columns) },
            direction: 'vertical',
            segmentNumber: 5,
        },
        {
            start: { x: parseInt(0.7 * columns), y: 0 },
            end: { x: parseInt(0.7 * columns), y: parseInt(0.3 * columns) },
            direction: 'vertical',
            segmentNumber: 6,
        },
        {
            start: { x: parseInt(0.7 * columns), y: parseInt(0.3 * columns) },
            end: { x: parseInt(0.9 * columns), y: parseInt(0.3 * columns) },
            direction: 'horizontal',
            segmentNumber: 7,
        },
        {
            start: { x: parseInt(0.2 * columns), y: parseInt(0.5 * columns) },
            end: { x: parseInt(0.2 * columns), y: parseInt(0.7 * columns) },
            direction: 'vertical',
            segmentNumber: 8,
        },
        {
            start: { x: parseInt(0.2 * columns), y: parseInt(0.5 * columns) },
            end: { x: parseInt(0.2 * columns), y: parseInt(0.7 * columns) },
            direction: 'vertical',
            segmentNumber: 9,
        },
        {
            start: { x: parseInt(0.1 * columns), y: parseInt(0.7 * columns) },
            end: { x: parseInt(0.3 * columns), y: parseInt(0.7 * columns) },
            direction: 'horizontal',
            segmentNumber: 10,
        },
        {
            start: { x: parseInt(0.3 * columns), y: parseInt(0.7 * columns) },
            end: { x: parseInt(0.3 * columns), y: parseInt(0.9 * columns) },
            direction: 'vertical',
            segmentNumber: 11,
        },
        {
            start: { x: parseInt(0.6 * columns), y: parseInt(0.7 * columns) },
            end: { x: parseInt(0.75 * columns), y: parseInt(0.7 * columns) },
            direction: 'horizontal',
            segmentNumber: 12,
        },
    ];

    // Set để lưu trữ các điểm mê cung duy nhất đã được thêm vào.
    const uniquePoints = new Set();

    // Duyệt qua từng đoạn mê cung và tạo mảng các điểm, loại bỏ các điểm trùng lặp.
    mazeSegments.forEach(({ start, end, direction, segmentNumber }) => {
        const path = createPath(start, end, direction, segmentNumber);
        path.forEach((point) => {
            const pointKey = `${point.x}-${point.y}`;
            if (!uniquePoints.has(pointKey)) {
                uniquePoints.add(pointKey);
                gameState.maze.push(point);
            }
        });
    });

    drawMaze(enableMaze);
};

/** Vẽ mê cung trên lưới trò chơi.*/
const drawMaze = (enableMaze) => {
    if (enableMaze) {
        gameState.maze.forEach((maze) => {
            const locate = getCell(maze.x, maze.y);
            locate.setAttribute('class', 'barrier');
            locate.setAttribute('segmentNumber', maze.segmentNumber);
        });
    }
};

/** Loại bỏ mê cung khỏi lưới trò chơi.*/
const removeMaze = () => {
    gameState.maze.forEach((maze) => {
        const locate = getCell(maze.x, maze.y);
        locate.removeAttribute('class', 'barrier');
    });
    gameState.maze.length = 0;
};

/** Hàm được sử dụng để bắt đầu trò chơi khi trang web được tải hoàn toàn. */
const play = () => {
    // Đặt thuộc tính paused của trò chơi là true để tạm dừng trò chơi khi mới bắt đầu.
    document.getElementById('game').setAttribute('paused', 'true');
    document.getElementById('selectMode').addEventListener('change', handleModeChange);
    createGrid();
    setListeners();
    showRules();
    initializeSelectMode();
    resetGem();
    draw();
};

window.onload = () => play();
