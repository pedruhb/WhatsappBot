import java.awt.Color;

public class SeamCarver {
    private static final double BORDER_ENERGY = 1000.0;
    private final Queue<Integer> indices = new Queue<Integer>();
    private double[][] distTo;
    private int[][] edgeTo;
    private Picture currPicture;
    private double[][] energyGrid;
    private double maxEnergy;
    
    public boolean draw = false;
    public boolean drawSeams = false;
    public boolean carveVertical = true;
    public boolean carveHorizontal = true;

    // create a seam carver object based on the given picture
    public SeamCarver(Picture picture) {
        if (picture == null)
            throw new IllegalArgumentException("null input");
        this.currPicture = new Picture(picture);
    }

    // current picture
    public Picture picture() {
        return new Picture(this.currPicture);
    }

    // width of current picture
    public int width() {
        return this.currPicture.width();
    }

    // height of current picture
    public int height() {
        return this.currPicture.height();
    }

    // energy of pixel at column x and row y
    private double energy(int x, int y) {
        validateWidth(x);
        validateHeight(y);
        if (x == 0 || x == width() - 1 || y == 0 || y == height() - 1)
            return BORDER_ENERGY;

        Color plusOneX = this.currPicture.get(x + 1, y);
        Color minusOneX = this.currPicture.get(x - 1, y);
        double gradientX = Math.pow(plusOneX.getRed() - minusOneX.getRed(), 2)
                + Math.pow(plusOneX.getGreen() - minusOneX.getGreen(), 2)
                + Math.pow(plusOneX.getBlue() - minusOneX.getBlue(), 2);

        Color plusOneY = this.currPicture.get(x, y + 1);
        Color minusOneY = this.currPicture.get(x, y - 1);
        double gradientY = Math.pow(plusOneY.getRed() - minusOneY.getRed(), 2)
                + Math.pow(plusOneY.getGreen() - minusOneY.getGreen(), 2)
                + Math.pow(plusOneY.getBlue() - minusOneY.getBlue(), 2);

        return Math.sqrt(gradientX + gradientY);
    }

    private void validateWidth(int x) {
        if (x < 0 || x >= width())
            throw new IllegalArgumentException("x out of bounds for current width.");
    }

    private void validateHeight(int y) {
        if (y < 0 || y >= height())
            throw new IllegalArgumentException("y out of bounds for current height.");
    }

    // sequence of indices for horizontal seam
    private int[] findHorizontalSeam() {
        buildEnergyGrid();
        distTo = new double[height()][width()];
        edgeTo = new int[height()][width()];
        // initialize lengths
        for (int row = 0; row < height(); row++) {
            for (int col = 1; col < width(); col++) {
                distTo[row][col] = Double.POSITIVE_INFINITY;
            }
        }

        // relax left
        for (int row = 0; row < height(); row++) {
            indices.enqueue(colRowToIndex(0, row));
        }

        while (!indices.isEmpty()) {
            int parentIndex = indices.dequeue();
            int colParent = indexToCol(parentIndex);
            int rowParent = indexToRow(parentIndex);
            for (int rowChild : adjHorizontal(colParent, rowParent)) {
                relax(parentIndex, rowParent, colParent, rowChild, colParent + 1);
            }
        }

        double minPathWeight = Double.POSITIVE_INFINITY;
        int minRow = 0;
        for (int row = 0; row < height(); row++) {
            if (distTo[row][width() - 1] < minPathWeight) {
                minPathWeight = distTo[row][width() - 1];
                minRow = row;
            }
        }

        int[] horizontalSeam = new int[width()];
        for (int i = horizontalSeam.length - 1; i >= 0; i--) {
            horizontalSeam[i] = minRow;
            minRow = indexToRow(edgeTo[minRow][i]);
        }

        distTo = null;
        edgeTo = null;

        return horizontalSeam;
    }

    // sequence of indices for vertical seam
    private int[] findVerticalSeam() {
        buildEnergyGrid();
        distTo = new double[height()][width()];
        edgeTo = new int[height()][width()];

        // initialize lengths
        for (int row = 1; row < height(); row++) {
            for (int col = 0; col < width(); col++) {
                distTo[row][col] = Double.POSITIVE_INFINITY;
            }
        }

        // relax top
        for (int col = 0; col < width(); col++) {
            indices.enqueue(col);
        }

        // find shortest paths
        while (!indices.isEmpty()) {
            int parentIndex = indices.dequeue();
            int colParent = indexToCol(parentIndex);
            int rowParent = indexToRow(parentIndex);
            for (int colChild : adjVertical(colParent, rowParent)) {
                relax(parentIndex, rowParent, colParent, rowParent + 1, colChild);
            }
        }

        // find smallest path end point
        double minPathWeight = Double.POSITIVE_INFINITY;
        int minCol = 0;
        for (int col = 0; col < width(); col++) {
            if (distTo[height() - 1][col] < minPathWeight) {
                minPathWeight = distTo[height() - 1][col];
                minCol = col;
            }
        }

        // create vertical seam from end point
        int[] verticalSeam = new int[height()];
        for (int i = verticalSeam.length - 1; i >= 0; i--) {
            verticalSeam[i] = minCol;
            minCol = indexToCol(edgeTo[i][minCol]);
        }

        // garbage collection
        distTo = null;
        edgeTo = null;

        return verticalSeam;
    }

    private void relax(int parentIndex, int rowParent, int colParent, int rowChild, int colChild) {

        int childIndex = colRowToIndex(colChild, rowChild);

        double distToParent = distTo[rowParent][colParent];
        double childEnergy = energyGrid[rowChild][colChild];
        // StdOut.println(childEnergy);
        double distToChild = distTo[rowChild][colChild];
        // StdOut.println(parentIndex + " " + childIndex);
        if (distToParent + childEnergy < distToChild) {
            edgeTo[rowChild][colChild] = parentIndex;
            distTo[rowChild][colChild] = distToParent + childEnergy;
            indices.enqueue(childIndex);
        }
    }

    private int colRowToIndex(int col, int row) {
        return row * width() + col;
    }

    private int indexToRow(int index) {
        return index / width();
    }

    private int indexToCol(int index) {
        return index % width();
    }

    private Iterable<Integer> adjHorizontal(int col, int row) {
        Bag<Integer> adj = new Bag<>();
        if (col == width() - 1) {
            return adj;
        } else if (row == 0 && row == height() - 1) {
            adj.add(row);
        } else if (row == 0) {
            adj.add(row);
            adj.add(row + 1);
        } else if (row == height() - 1) {
            adj.add(row);
            adj.add(row - 1);
        } else {
            adj.add(row);
            adj.add(row + 1);
            adj.add(row - 1);
        }
        return adj;
    }

    private Iterable<Integer> adjVertical(int col, int row) {
        Bag<Integer> adj = new Bag<>();
        if (row == height() - 1) {
            return adj;
        } else if (col == 0 && col == width() - 1) {
            adj.add(col);
        } else if (col == 0) {
            // far left, below and right
            adj.add(col);
            adj.add(col + 1);
        } else if (col == width() - 1) {
            // far right and not the bottom, below and left
            adj.add(col);
            adj.add(col - 1);
        } else {
            // not at the extremes but not at the bottom, three below
            adj.add(col);
            adj.add(col - 1);
            adj.add(col + 1);
        }
        return adj;
    }

    // remove horizontal seam from current picture
    private void removeHorizontalSeam(int[] seam) {
        validateHorizSeam(seam);
        Picture newPicture = new Picture(width(), height() - 1);

        for (int col = 0; col < width(); col++) {
            int rowToIgnore = seam[col];
            for (int row = 0; row < rowToIgnore; row++) {
                newPicture.setRGB(col, row, this.currPicture.getRGB(col, row));
            }
            for (int row = rowToIgnore; row < height() - 1; row++) {
                newPicture.setRGB(col, row, this.currPicture.getRGB(col, row + 1));
            }
        }

        this.currPicture = newPicture;
    }

    private void buildEnergyGrid() {
        energyGrid = new double[height()][width()];
         maxEnergy = Double.NEGATIVE_INFINITY;
        for (int row = 0; row < height(); row++) {
            for (int col = 0; col < width(); col++) {
                double energy = energy(col, row);
                energyGrid[row][col] = energy;
                 if (energy > maxEnergy)
                 maxEnergy = energy;
            }
        }
    }

    // remove vertical seam from current picture
    private void removeVerticalSeam(int[] seam) {
        validateVertSeam(seam);
        Picture newPicture = new Picture(width() - 1, height());
        for (int row = 0; row < height(); row++) {
            int colToIgnore = seam[row];
            for (int col = 0; col < colToIgnore; col++) {
                newPicture.setRGB(col, row, this.currPicture.getRGB(col, row));
            }

            for (int col = colToIgnore; col < width() - 1; col++) {
                newPicture.setRGB(col, row, this.currPicture.getRGB(col + 1, row));
            }
        }
        this.currPicture = newPicture;
    }

    private void validateHorizSeam(int[] seam) {
        if (seam == null)
            throw new IllegalArgumentException("null input");
        if (height() <= 1)
            throw new IllegalArgumentException("Image height is less or equal to 1.");
        if (seam.length != width())
            throw new IllegalArgumentException("Horizontal seam has incorrect Width.");
        for (int i = 0; i < seam.length; i++) {
            if (seam[i] < 0 || seam[i] >= height() || (i != 0 && Math.abs(seam[i] - seam[i - 1]) >= 2))
                throw new IllegalArgumentException("Seam contains illegal pixel.");
        }
    }

    private void validateVertSeam(int[] seam) {
        if (seam == null)
            throw new IllegalArgumentException("null input");
        if (width() <= 1)
            throw new IllegalArgumentException("Image width is less or equal to 1.");
        if (seam.length != height())
            throw new IllegalArgumentException("Vertical seam has incorrect height.");
        for (int i = 0; i < seam.length; i++) {
            if (seam[i] < 0 || seam[i] >= width() || (i != 0 && Math.abs(seam[i] - seam[i - 1]) >= 2))
                throw new IllegalArgumentException("Seam contains illegal pixel.");
        }
    }

    @SuppressWarnings("unused")
    private void simulateEnergy() {
        buildEnergyGrid();
        int canvasWidth = width();
        int canvasHeight = height();
        StdDraw.enableDoubleBuffering();
        StdDraw.setCanvasSize(canvasWidth, canvasHeight);
        StdDraw.setXscale(0, canvasWidth);
        StdDraw.setYscale(canvasHeight, 0);
        while (width() > 1 && height() > 1) {
            StdDraw.clear();
            drawEnergy();
            if (drawSeams && carveVertical) {
                int[] verticalSeam = findVerticalSeam();
                StdDraw.setPenColor(StdDraw.YELLOW);
                for (int row = 0; row < verticalSeam.length; row++) {
                    StdDraw.point(verticalSeam[row], row);
                }
                removeVerticalSeam(verticalSeam);
            } else if(carveVertical) {
                removeVerticalSeam(findVerticalSeam());
            }
            
            if (drawSeams && carveHorizontal) {
                StdDraw.setPenColor(StdDraw.YELLOW);
                int[] horizontalSeam = findHorizontalSeam();
                for (int col = 0; col < horizontalSeam.length; col++) {
                    StdDraw.point(col, horizontalSeam[col]);
                }
                removeHorizontalSeam(horizontalSeam);
            } else if(carveHorizontal) {
                removeHorizontalSeam(findHorizontalSeam());
            }
            StdDraw.show();
        }
    }

    private void drawEnergy() {

        StdDraw.setPenRadius(0);
        for (int row = 0; row < height(); row++) {
            for (int col = 0; col < width(); col++) {
                // uniformalize, then f(x) = 255*x^1/4
                int color = (int) (Math.pow((energyGrid[row][col] / maxEnergy), 1.0 / 3) * 255);
                StdDraw.setPenColor(new Color(color, 0, 255 - color));
                StdDraw.point(col, row);
            }
        }
    }
    
    public void simulate() {
        simulate(1, 1);
    }
    
    public void simulate(int widthLimit, int heightLimit) {
        if (widthLimit < 1 || heightLimit < 1)
            throw new IllegalArgumentException("Invalid width or height");
        int canvasWidth = width();
        int canvasHeight = height();
        double barSize = (double) canvasHeight / 15;
        if (draw) {
            StdDraw.enableDoubleBuffering();
            StdDraw.setCanvasSize(canvasWidth, canvasHeight);
            StdDraw.setXscale(0, canvasWidth);
            StdDraw.setYscale(canvasHeight + barSize, 0);
            StdDraw.setPenRadius(0);
        }
        
        while ((width() > widthLimit && carveVertical ) || (height() > heightLimit && carveHorizontal)) {
            if (draw) {
                StdDraw.clear();
                drawPixels(canvasWidth, canvasHeight);
            }
            printPercentage(canvasWidth, canvasHeight, heightLimit, widthLimit, barSize);
            
            carveVertically(widthLimit);
            carveHorizontally(heightLimit);
        }
    }
    
    private void carveHorizontally (int heightLimit) {
        if (carveHorizontal && height() > heightLimit) {
            if (draw && drawSeams) {
                StdDraw.setPenColor(StdDraw.RED);
                int[] horizontalSeam = findHorizontalSeam();
                for (int col = 0; col < horizontalSeam.length; col++) {
                    StdDraw.point(col, horizontalSeam[col]);
                }
                StdDraw.show();
                removeHorizontalSeam(horizontalSeam);
            } else {
                removeHorizontalSeam(findHorizontalSeam());
            }
        }
    }
    
    private void carveVertically(int widthLimit) {
        if (carveVertical && width() > widthLimit) {
            if (draw && drawSeams) {
                int[] verticalSeam = findVerticalSeam();
                StdDraw.setPenColor(StdDraw.RED);
                for (int row = 0; row < verticalSeam.length; row++) {
                    StdDraw.point(verticalSeam[row], row);
                }
                StdDraw.show();
                removeVerticalSeam(verticalSeam);
            } else {
                removeVerticalSeam(findVerticalSeam());
            } 
        }
    }
    
    private void printPercentage(int canvasWidth, int canvasHeight, 
            int heightLimit, int widthLimit, double barSize) {
        
        double percentDoneHeight = carveHorizontal ? (double)(canvasHeight - height()) / 
                (canvasHeight - heightLimit - 1) * 100 : 100.0;
        double percentDoneWidth = carveVertical ? (double)(canvasWidth - width()) / 
                (canvasWidth - widthLimit - 1) * 100 : 100.0;
        
        double percentage = Math.min(percentDoneHeight, percentDoneWidth);
        
        if (draw) {
            StdDraw.setPenColor(StdDraw.RED);
            StdDraw.textLeft(0, canvasHeight + barSize/2, String.format("%.2f%% done", percentage));
            StdDraw.show();
        } else {
         // if not drawing, log progress
            StdOut.println(String.format("%.2f%% done", percentage));
        }
        
    }
    
    private void drawPixels(int canvasWidth, int canvasHeight) {
        for (int row = 0; row < canvasHeight; row++) {
            for (int col = 0; col < canvasWidth; col++) {
                if (row < height() && col < width()) {
                    StdDraw.setPenColor(currPicture.get(col, row));
                } else {
                    StdDraw.setPenColor(StdDraw.WHITE);
                }

                StdDraw.point(col, row);
            }
        }
        StdDraw.show();
    }
    
    private void draw() {
        this.currPicture.show();
    }
    
    private void deleteEveryOtherPixel() {
        int factor = 5;
        Picture newPic = new Picture((int)(width()/factor), height());
        for (int col = 0; col < (int)(width()/factor); col++) {
            for (int row = 0; row < height(); row++) {
                newPic.setRGB(col, row, this.currPicture.getRGB((int)(col*factor), row));
            }
        }
        this.currPicture = newPic;
    }
    
    public void save(String path) {
        this.currPicture.save(path);
    }

    // unit testing (optional)
    public static void main(String[] args) {
        String filePath = args[0];
        int witdhLimit = Integer.parseInt(args[1]);
        int heightLimit = Integer.parseInt(args[2]);
        String savePath = args[3];
        SeamCarver sc = new SeamCarver(new Picture(filePath));
        sc.simulate(witdhLimit, heightLimit);
        sc.save(savePath);
    }
}