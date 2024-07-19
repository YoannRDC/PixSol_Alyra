type InputType = {
    id?: number | null;
    x?: number | null;
    y?: number | null;
}

function getCoordinatesFromId(id: number): { x: number; y: number } {
    const row = Math.floor((id - 1) / 1000); 
    const col = (id - 1) % 1000;

    return { x: col + 1, y: row + 1 }; 
}

function getIdFromCoordinates(x: number, y: number): number {
    return (y - 1) * 20 + x;
}


function dynamicInput({ id, x, y }: InputType): void {
    if (id !== null && id !== undefined) {
        const { x: coordX, y: coordY } = getCoordinatesFromId(id);
        console.log(`ID ${id} corresponds to x=${coordX}, y=${coordY}`);
    } else if (x !== null && x !== undefined && y !== null && y !== undefined) {
        const id = getIdFromCoordinates(x, y);
        console.log(`Coordinates x=${x}, y=${y} correspond to ID ${id}`);
    } else {
        console.log("Please provide either an ID or both x and y coordinates.");
    }
}


dynamicInput({ id: 11343 });
dynamicInput({ x: 1, y: 1000 }); 
dynamicInput({ x: 1000, y: 1000 });