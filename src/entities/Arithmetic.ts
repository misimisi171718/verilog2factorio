import { ConnectionPoint, EntityBase, SignalID } from "../blueprint.js";
import { logger } from "../logger.js";

import { Entity, Endpoint, everything, anything, each } from "./Entity.js";

export enum ArithmeticOperations {
    Mul = "*",
    Div = "/",
    Add = "+",
    Sub = "-",
    Mod = "%",
    Pow = "^",
    LShift = "<<",
    RShift = ">>",
    And = "AND",
    Or = "OR",
    Xor = "XOR"
}

export interface ArithmeticControlBehavior {
    first_signal?: SignalID,
    second_signal?: SignalID;
    first_constant?: number;
    second_constant?: number;

    operation: ArithmeticOperations;
    output_signal: SignalID;
}

export interface ArithmeticCombinator extends EntityBase {
    name: "arithmetic-combinator";
    control_behavior: {
        arithmetic_conditions: ArithmeticControlBehavior
    };
    connections: {
        "1": ConnectionPoint,
        "2": ConnectionPoint
    };
}

export class Arithmetic extends Entity {
    params: ArithmeticControlBehavior;

    constructor(params: ArithmeticControlBehavior) {
        super(1, 2);
        this.params = params;

        this.input = new Endpoint(this, 1);
        if (params.output_signal == each) {
            logger.assert(params.first_signal == each);
            this.output = new Endpoint(this, 2);
        } else {
            this.output = new Endpoint(this, 2, params.output_signal);
        }

        // can only use each signal
        logger.assert(params.first_signal  !== everything && params.first_signal  !== anything, "invalid use of special signal");
        logger.assert(params.second_signal !== everything && params.second_signal !== anything && params.second_signal !== each, "invalid use of special signal");
        logger.assert(params.output_signal !== everything && params.output_signal !== anything, "invalid use of special signal");

        logger.assert(params.first_signal ? params.first_constant === undefined : params.first_constant !== undefined, "no first input given");
        logger.assert(params.second_signal ? params.second_constant === undefined : params.second_constant !== undefined, "no second input given");
    }

    override netSignalAdd(e: Endpoint, s: SignalID) {
        if (e == this.input && this.params.output_signal == each) {
            this.output.outSignals.add(s);

            // ripple update
            this.output.red?.addSignal(s);
            this.output.green?.addSignal(s);
        }
    }

    toObj(): ArithmeticCombinator {
        if (!this.input.red && !this.input.green || !this.output.red && !this.output.green) {
            throw new Error("Unconnected Arithmetic");
        }

        return {
            entity_number: this.id,
            name: "arithmetic-combinator",
            position: { x: this.x, y: this.y },
            direction: this.dir,
            control_behavior: {
                arithmetic_conditions: this.params
            },
            connections: {
                "1": this.input.convert(),
                "2": this.output.convert()
            }
        };
    }
}
