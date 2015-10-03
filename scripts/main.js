const App = {
    canvas: undefined,

    context: undefined,

    isMouseOrTouchDown: false,

    log: [],

    currentLogIndex: 0,

    DEFAULT_ERASER_SIZE: 20,

    eraserSize: undefined,

    timeTimeLogLastCalled: undefined,

    timeToDebounceFor: 250,

    init: function() {
        this.canvas = document.getElementById('canvas');
        this.context = this.canvas.getContext('2d');
        this.setEraserSize(this.DEFAULT_ERASER_SIZE);
        this.drawOriginalImageOntoCanvas();
        this.setUpClickAndTouchEventListeners();
    },

    drawOriginalImageOntoCanvas: function() {
        const originalImage = document.getElementById('original-image');
        this.context.drawImage(originalImage, 0, 0);
    },

    setUpClickAndTouchEventListeners: function() {
        this.canvas.addEventListener('click', event => this.clearCircle(event.offsetX, event.offsetY));

        this.canvas.addEventListener('mousemove', event => {
            if (this.isMouseOrTouchDown) {
                this.clearCircle(event.offsetX, event.offsetY);
            }
        });

        this.canvas.addEventListener('mousedown', event => this.isMouseOrTouchDown = true);

        // This mouseup must be caught anywhere in the document, incase the mouse leaves the
        // canvas whilst held down.
        document.addEventListener('mouseup', event => this.isMouseOrTouchDown = false);

        this.canvas.addEventListener('touchmove', event => {
            if (this.isMouseOrTouchDown) {
                this.clearCircle(
                    event.targetTouches[0].pageX - event.target.offsetLeft,
                    event.targetTouches[0].pageY - event.target.offsetTop
                );
            }

            event.preventDefault();
        });

        this.canvas.addEventListener('touchstart', event => this.isMouseOrTouchDown = true);

        // This touchup must be caught anywhere in the document, incase the touch leaves the
        // canvas whilst held down.
        document.addEventListener('touchend', event => this.isMouseOrTouchDown = false);
    },

    undo: function() {
        if (this.currentLogIndex === 1) {
            this.drawOriginalImageOntoCanvas();
            this.currentLogIndex = 0;
            return;
        } else if (this.currentLogIndex === 0) {
            return;
        } else if (this.currentLogIndex < 0) {
            throw new Error('currentLogIndex < 0');
        }

        this.currentLogIndex--;
        this.context.drawImage(this.log[this.currentLogIndex], 0, 0);
    },

    undoSteps: function(numberOfSteps) {
        for (let i = 0; i < numberOfSteps; i++) {
            this.undo();
        }
    },

    redo: function() {
        if ((this.currentLogIndex + 1) === this.log.length) {
            return;
        } else if (this.currentLogIndex >= this.log.length) {
            throw new Error('currentLogIndex >= log.length');
        }

        // The canvas must be cleared first. Otherwise the transparent pixels in the new
        // image data will not replace the existing pixels.
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.currentLogIndex++;
        this.context.drawImage(this.log[this.currentLogIndex], 0, 0);
    },

    clearCircle: function(x, y) {
        this.context.save();
        this.context.globalCompositeOperation = 'destination-out';
        this.context.beginPath();
        this.context.arc(x, y, this.eraserSize, 0, 2 * Math.PI, false);
        this.context.fill();
        this.context.restore();

        this.takeLog();
    },

    takeLog: function() {
        // Debounce this function so the log doesn't grow huge and use tons of memory,
        // and to improve usability.
        this.timeTimeLogLastCalled = Date.now();

        setTimeout(
            () => {
                if (Date.now() - this.timeTimeLogLastCalled < this.timeToDebounceFor) {
                    return;
                }

                const newImageLog = new Image();
                newImageLog.src = this.canvas.toDataURL('image/jpg');

                this.currentLogIndex++;
                this.log[this.currentLogIndex] = newImageLog;
            },
            this.timeToDebounceFor
        );
    },

    save: function() {
        const outputImage = document.getElementById('output-image');
        outputImage.src = this.canvas.toDataURL('image/jpg');
    },

    setEraserSize: function(size) {
        if (size > 100) {
            size = 100;
        } else if (size < 1) {
            size = 1;
        }

        this.eraserSize = size;

        // If a keyboard shortcut was used, the Angular interface needs updated too.
        const angularScope = angular.element(document.querySelector('canvas')).scope();
        angularScope.eraserSize = this.eraserSize;

        try {
            angularScope.$digest();
        } catch (e) {
            // This is OK - the Angular controller called `setEraserSize()`, so it is already
            // in an apply.
        }
    },

    decreaseEraserSize: function(size) {
        this.setEraserSize(this.eraserSize - 1);
    },

    increaseEraserSize: function(size) {
        this.setEraserSize(this.eraserSize + 1);
    },
};

window.addEventListener('load', function() {
    App.init();

    const listener = new window.keypress.Listener();

    listener.simple_combo('[', () => App.decreaseEraserSize());
    listener.simple_combo(']', () => App.increaseEraserSize());
    listener.simple_combo('ctrl z', () => App.undo());
    listener.simple_combo('ctrl y', () => App.redo());
});
