//
//  Item.swift
//  Relay
//
//  Created by Ben Jones on 7/3/2026.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
