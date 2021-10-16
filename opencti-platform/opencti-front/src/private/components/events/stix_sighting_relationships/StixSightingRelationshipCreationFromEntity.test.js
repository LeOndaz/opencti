const rewire = require("rewire")
const StixSightingRelationshipCreationFromEntity = rewire("./StixSightingRelationshipCreationFromEntity")
const styles = StixSightingRelationshipCreationFromEntity.__get__("styles")
const stixSightingRelationshipValidation = StixSightingRelationshipCreationFromEntity.__get__("stixSightingRelationshipValidation")
const sharedUpdater = StixSightingRelationshipCreationFromEntity.__get__("sharedUpdater")
// @ponicode
describe("styles", () => {
    test("0", () => {
        let callFunction = () => {
            styles({ palette: { navAlt: { background: "red", backgroundHeader: "https://twitter.com/path?abc" }, grey: ["hsl(10%,20%,40%)", "rgb(0,100,200)", "green"] }, transitions: { create: () => "NoWiFi4you" }, spacing: () => 100 })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            styles({ palette: { navAlt: { background: "rgb(20%,10%,30%)", backgroundHeader: "Www.GooGle.com" }, grey: ["rgb(0.1,0.2,0.3)", "#F00", "#F00"] }, transitions: { create: () => "NoWiFi4you" }, spacing: () => -5.48 })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            styles({ palette: { navAlt: { background: "black", backgroundHeader: "http://www.example.com/route/123?foo=bar" }, grey: ["hsl(10%,20%,40%)", "red", "red"] }, transitions: { create: () => "NoWiFi4you" }, spacing: () => 1 })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            styles({ palette: { navAlt: { background: "rgb(0,100,200)", backgroundHeader: "ponicode.com" }, grey: ["#FF00FF", "rgb(0.1,0.2,0.3)", "hsl(10%,20%,40%)"] }, transitions: { create: () => "YouarenotAllowed2Use" }, spacing: () => -5.48 })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            styles({ palette: { navAlt: { background: "red", backgroundHeader: "https://api.telegram.org/" }, grey: ["green", "#FF00FF", "rgb(0,100,200)"] }, transitions: { create: () => "NoWiFi4you" }, spacing: () => 0 })
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            styles(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("stixSightingRelationshipValidation", () => {
    test("0", () => {
        let callFunction = () => {
            stixSightingRelationshipValidation(() => -5.48)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            stixSightingRelationshipValidation(() => 100)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            stixSightingRelationshipValidation(() => -100)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            stixSightingRelationshipValidation(() => 1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            stixSightingRelationshipValidation(() => 0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            stixSightingRelationshipValidation(() => Infinity)
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("sharedUpdater", () => {
    test("0", () => {
        let callFunction = () => {
            sharedUpdater({ get: () => "^5.0.0" }, "bc23a9d531064583ace8f67dad60f6bb", [true, false, false], 100)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            sharedUpdater({ get: () => "v1.2.4" }, 9876, [true, true, true], 0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            sharedUpdater({ get: () => "4.0.0-beta1\t" }, "da7588892", [false, true, false], -5.48)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            sharedUpdater({ get: () => "v1.2.4" }, "da7588892", [true, true, false], 1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            sharedUpdater({ get: () => "v4.0.0-rc.4" }, "bc23a9d531064583ace8f67dad60f6bb", [true, false, true], 100)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction = () => {
            sharedUpdater(undefined, "", [], NaN)
        }
    
        expect(callFunction).not.toThrow()
    })
})
